from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Deviation(Base):
    __tablename__ = "deviations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Section 1 - Deviation information
    site_plant: Mapped[str | None] = mapped_column(String(120), default=None)
    date_of_occurrence: Mapped[date | None] = mapped_column(Date, default=None)
    title: Mapped[str | None] = mapped_column(String(255), default=None)
    source: Mapped[str | None] = mapped_column(String(80), default=None)
    product_material: Mapped[str | None] = mapped_column(String(255), default=None)
    batch_lot_number: Mapped[str | None] = mapped_column(String(80), default=None)

    # Section 2 - Deviation details
    detailed_description: Mapped[str | None] = mapped_column(Text, default=None)
    initial_impact: Mapped[str | None] = mapped_column(String(30), default=None)
    initial_severity: Mapped[str | None] = mapped_column(String(30), default=None)

    # AI assistance output (kept separately so the user's review is auditable)
    ai_impact: Mapped[str | None] = mapped_column(String(30), default=None)
    ai_severity: Mapped[str | None] = mapped_column(String(30), default=None)
    ai_reason: Mapped[str | None] = mapped_column(Text, default=None)
    ai_extractions: Mapped[str | None] = mapped_column(Text, default=None)  # JSON audit trail

    # Source material
    raw_input: Mapped[str | None] = mapped_column(Text, default=None)
    source_filename: Mapped[str | None] = mapped_column(String(255), default=None)

    status: Mapped[str] = mapped_column(String(30), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
