"""
routers/history.py — Sign detection history per user.

GET    /history          →  list of DetectionOut (most recent first)
POST   /history          →  save one detection event
DELETE /history          →  clear all history for the current user
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.database import get_db
from app.deps import get_current_user
from app.models.detection import DetectionCreate, DetectionOut

router = APIRouter(prefix="/history", tags=["history"])

CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("")
async def get_history(
    current_user: CurrentUser,
    limit: int = Query(default=50, le=200),
) -> list[DetectionOut]:
    """Return the most recent sign detections for the authenticated user."""
    db = get_db()
    cursor = db["detections"].find(
        {"user_id": str(current_user["_id"])},
        sort=[("timestamp", -1)],
        limit=limit,
    )
    docs = await cursor.to_list(length=limit)
    return [
        DetectionOut(
            id=str(d["_id"]),
            sign=d["sign"],
            confidence=d["confidence"],
            timestamp=d["timestamp"],
        )
        for d in docs
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def save_detection(
    body: DetectionCreate,
    current_user: CurrentUser,
) -> DetectionOut:
    """Persist a single sign detection event."""
    db = get_db()
    doc = {
        "user_id": str(current_user["_id"]),
        "sign": body.sign,
        "confidence": body.confidence,
        "timestamp": datetime.now(timezone.utc),
    }
    result = await db["detections"].insert_one(doc)
    return DetectionOut(
        id=str(result.inserted_id),
        sign=doc["sign"],
        confidence=doc["confidence"],
        timestamp=doc["timestamp"],
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(current_user: CurrentUser) -> None:
    """Delete all detection history for the authenticated user."""
    db = get_db()
    await db["detections"].delete_many({"user_id": str(current_user["_id"])})
