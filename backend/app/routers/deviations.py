"""CRUD for saved deviations."""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deviation
from ..schemas import DeviationCreate, DeviationOut

router = APIRouter(prefix="/api/deviations", tags=["deviations"])


@router.post("", response_model=DeviationOut)
def create_deviation(body: DeviationCreate, db: Session = Depends(get_db)):
    if not (body.title and body.title.strip()):
        raise HTTPException(422, "Title is required.")
    if not (body.detailed_description and body.detailed_description.strip()):
        raise HTTPException(422, "Detailed description is required.")

    payload = body.model_dump()
    payload["status"] = "open"
    # keep the AI's original suggestion for the audit trail even if the user edited the form
    payload["ai_extractions"] = json.dumps(
        {
            "impact": body.ai_impact,
            "severity": body.ai_severity,
            "reason": body.ai_reason,
        }
    )
    record = Deviation(**payload)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[DeviationOut])
def list_deviations(limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Deviation)
        .order_by(Deviation.created_at.desc())
        .limit(min(limit, 200))
        .all()
    )


@router.get("/{deviation_id}", response_model=DeviationOut)
def get_deviation(deviation_id: int, db: Session = Depends(get_db)):
    record = db.get(Deviation, deviation_id)
    if not record:
        raise HTTPException(404, "Deviation not found.")
    return record
