"""
app/database.py — Async MongoDB connection via Motor.
"""
from __future__ import annotations

import motor.motor_asyncio

from app import config

_client: motor.motor_asyncio.AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    _client = motor.motor_asyncio.AsyncIOMotorClient(config.MONGODB_URL)
    # Verify connection is alive before proceeding
    await _client.admin.command("ping")
    print(f"✅  MongoDB connected → {config.MONGODB_URL}")

    # Create indexes for efficient queries
    db = _client[config.MONGODB_DB_NAME]
    await db["users"].create_index("email", unique=True)
    await db["detections"].create_index([("user_id", 1), ("timestamp", -1)])
    await db["messages"].create_index([("user_id", 1), ("timestamp", 1)])


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
        print("👋  MongoDB disconnected.")


def get_db() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    """Return the active database. Must be called after connect_db()."""
    if _client is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _client[config.MONGODB_DB_NAME]
