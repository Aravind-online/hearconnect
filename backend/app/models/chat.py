"""
app/models/chat.py — Pydantic schemas for persistent chat messages.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: str
    from_name: str
    text: str
    mine: bool
    timestamp: datetime
