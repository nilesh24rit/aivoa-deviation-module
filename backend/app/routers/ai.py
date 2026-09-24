"""AI endpoints: extraction (SSE), impact re-assessment, and assistant chat."""

import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from ..ai.files import extract_text_from_upload
from ..ai.graph import NODE_PROGRESS, deviation_graph
from ..ai.llm import get_llm
from ..ai.prompts import ASSESS_SYSTEM, ASSESS_USER, CHAT_SYSTEM, CHAT_USER
from ..constants import IMPACT_OPTIONS, SEVERITY_OPTIONS
from ..schemas import ChatMessage

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, default=str)}\n\n"


@router.post("/extract")
async def extract(
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
):
    """Run the LangGraph extraction pipeline, streaming progress over SSE.

    Emits: start -> node progress events -> result | error.
    """
    source_text = ""
    source_filename = None

    if file is not None and file.filename:
        data = await file.read()
        source_text = await extract_text_from_upload(file.filename, data)
        source_filename = file.filename
    elif text and text.strip():
        source_text = text.strip()
    else:
        raise HTTPException(400, "Provide a file or pasted deviation text.")

    async def event_stream():
        yield _sse({
            "event": "start",
            "progress": 5,
            "message": "Analysing document content and extracting key details...",
            "filename": source_filename,
        })
        try:
            final_state = None
            async for update in deviation_graph.astream(
                {"raw_text": source_text}, stream_mode="updates"
            ):
                for node_name, node_output in update.items():
                    pct, message = NODE_PROGRESS.get(node_name, (None, None))
                    if pct is not None:
                        yield _sse({
                            "event": "progress",
                            "node": node_name,
                            "progress": pct,
                            "message": message,
                        })
                    final_state = {**(final_state or {}), **(node_output or {})}

            fields = (final_state or {}).get("fields", {})
            assessment = (final_state or {}).get("assessment", {})
            yield _sse({
                "event": "result",
                "progress": 100,
                "message": "Extraction complete.",
                "filename": source_filename,
                "data": {
                    "fields": fields,
                    "assessment": {
                        "impact": assessment.get("impact"),
                        "severity": assessment.get("severity"),
                        "reason": assessment.get("reason"),
                    },
                    "raw_input": source_text,
                },
            })
        except Exception as exc:  # surface AI failures to the UI, not a hung progress bar
            yield _sse({
                "event": "error",
                "progress": 0,
                "message": str(exc),
            })

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/assess")
async def assess(body: ChatMessage):
    """Re-run only the impact/severity step, e.g. after the user edits the form."""
    ctx = body.context or {}
    user = ASSESS_USER.format(
        title=ctx.get("title") or "(not provided)",
        description=ctx.get("detailed_description") or body.message or "(not provided)",
        product=ctx.get("product_material") or "(not provided)",
        batch=ctx.get("batch_lot_number") or "(not provided)",
    )
    try:
        llm = get_llm(temperature=0.0)
        response = await llm.ainvoke(
            [{"role": "system", "content": ASSESS_SYSTEM}, {"role": "user", "content": user}]
        )
        from ..ai.graph import _parse_json

        data = _parse_json(response.content)
    except Exception as exc:
        raise HTTPException(502, f"AI assessment failed: {exc}")

    impact = data.get("impact") if data.get("impact") in IMPACT_OPTIONS else "Medium"
    severity = data.get("severity") if data.get("severity") in SEVERITY_OPTIONS else "Minor"
    return {
        "impact": impact,
        "severity": severity,
        "reason": str(data.get("reason") or "").strip(),
    }


@router.post("/chat")
async def chat(body: ChatMessage):
    if not body.message or not body.message.strip():
        raise HTTPException(400, "Message cannot be empty.")
    context = body.context or {}
    context_text = (
        "\n".join(f"{k}: {v}" for k, v in context.items() if v) or "(form is still empty)"
    )
    try:
        llm = get_llm(temperature=0.3)
        response = await llm.ainvoke(
            [
                {"role": "system", "content": CHAT_SYSTEM},
                {"role": "user", "content": CHAT_USER.format(context=context_text, message=body.message)},
            ]
        )
    except Exception as exc:
        raise HTTPException(502, f"AI assistant unavailable: {exc}")
    return {"reply": response.content}
