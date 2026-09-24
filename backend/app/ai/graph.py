"""LangGraph workflow: ingest -> extract -> assess -> validate.

The graph takes raw deviation text and returns populated form fields plus an
initial impact/severity recommendation. Each node reports progress so the API
can stream live status to the UI.
"""

import json
import re
from datetime import date, datetime
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, ValidationError

from ..constants import (
    IMPACT_OPTIONS,
    MAX_DESCRIPTION_LENGTH,
    MAX_TITLE_LENGTH,
    SEVERITY_OPTIONS,
    SITE_OPTIONS,
    SOURCE_OPTIONS,
)
from ..schemas import ExtractedFields
from .llm import get_llm
from .prompts import ASSESS_SYSTEM, ASSESS_USER, EXTRACT_SYSTEM, EXTRACT_USER


class GraphState(TypedDict, total=False):
    raw_text: str
    cleaned_text: str
    fields: dict[str, Any]
    assessment: dict[str, Any]


# --------------------------------------------------------------------------- helpers

def _parse_json(content: Any) -> dict:
    """Tolerant JSON extraction from an LLM response (handles ```fences and prose)."""
    if isinstance(content, dict):
        return content
    text = content if isinstance(content, str) else str(content)
    text = re.sub(r"```(?:json)?", "", text).strip("` \n")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Model did not return valid JSON: {text[:200]}")


def _coerce_date(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    s = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d.%m.%Y",
                "%B %d, %Y", "%d %B %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _validate_fields(payload: dict) -> dict:
    """Validate each field independently so one bad value does not fail the batch."""
    cleaned: dict[str, Any] = {}
    for key in ExtractedFields.model_fields:
        if key not in payload or payload[key] in ("", None):
            continue
        if key == "date_of_occurrence":
            coerced = _coerce_date(payload[key])
            if coerced:
                cleaned[key] = coerced
            continue
        try:
            single = ExtractedFields.model_validate({key: payload[key]})
            cleaned[key] = getattr(single, key)
        except ValidationError:
            continue
    return cleaned


async def _ask_json(system: str, user: str, temperature: float = 0.1) -> dict:
    llm = get_llm(temperature=temperature)
    response = await llm.ainvoke(
        [{"role": "system", "content": system}, {"role": "user", "content": user}]
    )
    return _parse_json(response.content)


# --------------------------------------------------------------------------- nodes

async def ingest_node(state: GraphState) -> dict:
    text = state.get("raw_text", "")
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    # Keep the prompt comfortably inside the model context window.
    if len(text) > 30000:
        text = text[:30000] + "\n\n[... truncated ...]"
    return {"cleaned_text": text}


async def extract_node(state: GraphState) -> dict:
    data = await _ask_json(EXTRACT_SYSTEM, EXTRACT_USER.format(text=state["cleaned_text"]))
    return {"fields": _validate_fields(data)}


async def assess_node(state: GraphState) -> dict:
    fields = state.get("fields", {})
    user = ASSESS_USER.format(
        title=fields.get("title") or "(not provided)",
        description=fields.get("detailed_description") or state.get("cleaned_text", "")[:4000],
        product=fields.get("product_material") or "(not provided)",
        batch=fields.get("batch_lot_number") or "(not provided)",
    )
    try:
        data = await _ask_json(ASSESS_SYSTEM, user, temperature=0.0)
    except Exception:
        data = {}
    impact = data.get("impact")
    severity = data.get("severity")
    reason = data.get("reason")
    if impact not in IMPACT_OPTIONS:
        impact = "Medium"
    if severity not in SEVERITY_OPTIONS:
        severity = "Minor"
    if not reason or not str(reason).strip():
        reason = (
            "AI recommendation unavailable for this input; conservative defaults applied. "
            "Please review and adjust before saving."
        )
    return {"assessment": {"impact": impact, "severity": severity, "reason": str(reason).strip()}}


async def validate_node(state: GraphState) -> dict:
    fields = dict(state.get("fields", {}))

    if fields.get("title"):
        fields["title"] = str(fields["title"]).strip()[:MAX_TITLE_LENGTH]

    if fields.get("detailed_description"):
        fields["detailed_description"] = str(fields["detailed_description"]).strip()[
            :MAX_DESCRIPTION_LENGTH
        ]

    if fields.get("source"):
        source = str(fields["source"]).strip()
        exact = next((s for s in SOURCE_OPTIONS if s.lower() == source.lower()), None)
        if exact:
            fields["source"] = exact
        else:
            fuzzy = next(
                (s for s in SOURCE_OPTIONS
                 if source.lower() in s.lower() or s.lower() in source.lower()),
                None,
            )
            fields["source"] = fuzzy or "Other"
    else:
        fields.pop("source", None)

    # Site/plant feeds a fixed dropdown too — snap close matches onto an option
    # (e.g. "API Manufacturing Unit, Building 2" -> "API Manufacturing Unit").
    if fields.get("site_plant"):
        site = str(fields["site_plant"]).strip()
        exact_site = next((s for s in SITE_OPTIONS if s.lower() == site.lower()), None)
        if exact_site:
            fields["site_plant"] = exact_site
        else:
            fuzzy_site = next(
                (s for s in SITE_OPTIONS
                 if s.lower() in site.lower() or site.lower() in s.lower()),
                None,
            )
            if fuzzy_site:
                fields["site_plant"] = fuzzy_site
    else:
        fields.pop("site_plant", None)

    if fields.get("date_of_occurrence"):
        fields["date_of_occurrence"] = _coerce_date(fields["date_of_occurrence"])

    for key in ("site_plant", "product_material", "batch_lot_number"):
        if fields.get(key):
            fields[key] = str(fields[key]).strip()[:255]

    return {"fields": fields, "assessment": state.get("assessment", {}), "cleaned_text": state.get("cleaned_text", "")}


# --------------------------------------------------------------------------- graph

def build_graph() -> StateGraph:
    g = StateGraph(GraphState)
    g.add_node("ingest", ingest_node)
    g.add_node("extract", extract_node)
    g.add_node("assess", assess_node)
    g.add_node("validate", validate_node)
    g.add_edge(START, "ingest")
    g.add_edge("ingest", "extract")
    g.add_edge("extract", "assess")
    g.add_edge("assess", "validate")
    g.add_edge("validate", END)
    return g


deviation_graph = build_graph().compile()

# Node name -> (progress %, user-facing status line)
NODE_PROGRESS = {
    "ingest": (15, "Reading document content..."),
    "extract": (55, "Extracting key details..."),
    "assess": (85, "Evaluating impact & severity..."),
    "validate": (100, "Finalizing recommendation..."),
}
