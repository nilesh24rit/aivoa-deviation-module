from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Impact = Literal["Low", "Medium", "High", "Critical"]
Severity = Literal["Minor", "Major", "Critical"]


class ExtractedFields(BaseModel):
    """Structured fields the AI pulls out of a deviation document / notes."""

    site_plant: str | None = None
    date_of_occurrence: date | None = None
    title: str | None = None
    source: str | None = None
    product_material: str | None = None
    batch_lot_number: str | None = None
    detailed_description: str | None = None


class Assessment(BaseModel):
    impact: Impact
    severity: Severity
    reason: str = Field(description="Short justification for the recommendation, 1-3 sentences")


class ExtractionResult(BaseModel):
    fields: ExtractedFields
    assessment: Assessment


class ChatMessage(BaseModel):
    message: str
    context: dict | None = None


class DeviationBase(BaseModel):
    site_plant: str | None = None
    date_of_occurrence: date | None = None
    title: str | None = None
    source: str | None = None
    product_material: str | None = None
    batch_lot_number: str | None = None
    detailed_description: str | None = None
    initial_impact: str | None = None
    initial_severity: str | None = None
    ai_impact: str | None = None
    ai_severity: str | None = None
    ai_reason: str | None = None
    raw_input: str | None = None
    source_filename: str | None = None
    status: str = "draft"


class DeviationCreate(DeviationBase):
    pass


class DeviationOut(DeviationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
