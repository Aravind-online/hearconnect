"""
app/models/detection.py — Pydantic schemas for sign detection history.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DetectionCreate(BaseModel):
    sign: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class DetectionOut(BaseModel):
    id: str
    sign: str
    confidence: float
    timestamp: datetime
