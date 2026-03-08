"""
routers/chat.py — Persistent chat messages per user.

GET    /chat/messages    →  list of MessageOut (chronological)
POST   /chat/messages    →  save a user message
DELETE /chat/messages    →  clear all messages for the current user
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.database import get_db
from app.deps import get_current_user
from app.models.chat import MessageCreate, MessageOut

router = APIRouter(prefix="/chat", tags=["chat"])

CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/messages")
async def get_messages(
    current_user: CurrentUser,
    limit: int = Query(default=50, le=200),
) -> list[MessageOut]:
    """Return the most recent chat messages for the authenticated user."""
    db = get_db()
    cursor = db["messages"].find(
        {"user_id": str(current_user["_id"])},
        sort=[("timestamp", 1)],
        limit=limit,
    )
    docs = await cursor.to_list(length=limit)
    return [
        MessageOut(
            id=str(d["_id"]),
            from_name=d["from_name"],
            text=d["text"],
            mine=d["mine"],
            timestamp=d["timestamp"],
        )
        for d in docs
    ]


@router.post("/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    body: MessageCreate,
    current_user: CurrentUser,
) -> MessageOut:
    """Persist a chat message from the authenticated user."""
    db = get_db()
    username = current_user.get("username", "You")
    doc = {
        "user_id": str(current_user["_id"]),
        "from_name": username,
        "text": body.text,
        "mine": True,
        "timestamp": datetime.now(timezone.utc),
    }
    result = await db["messages"].insert_one(doc)
    return MessageOut(
        id=str(result.inserted_id),
        from_name=doc["from_name"],
        text=doc["text"],
        mine=True,
        timestamp=doc["timestamp"],
    )


@router.delete("/messages", status_code=status.HTTP_204_NO_CONTENT)
async def clear_messages(current_user: CurrentUser) -> None:
    """Delete all chat messages for the authenticated user."""
    db = get_db()
    await db["messages"].delete_many({"user_id": str(current_user["_id"])})
