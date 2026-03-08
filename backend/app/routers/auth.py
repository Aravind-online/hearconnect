"""
routers/auth.py — User registration and login.

POST /auth/register  →  {access_token, token_type, user}
POST /auth/login     →  {access_token, token_type, user}
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status
from jose import jwt
from passlib.context import CryptContext

from app import config
from app.database import get_db
from app.models.user import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return _pwd.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        config.JWT_SECRET,
        algorithm=config.JWT_ALGORITHM,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate) -> dict:
    """Create a new user account and return a JWT."""
    db = get_db()
    if await db["users"].find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")

    doc = {
        "username": body.username,
        "email": body.email,
        "hashed_password": _hash_password(body.password),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["users"].insert_one(doc)
    user_id = str(result.inserted_id)
    token = _create_token(user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut(
            id=user_id,
            username=body.username,
            email=body.email,
            created_at=doc["created_at"],
        ),
    }


@router.post("/login")
async def login(body: UserLogin) -> dict:
    """Verify credentials and return a JWT."""
    db = get_db()
    user = await db["users"].find_one({"email": body.email})
    if not user or not _verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = str(user["_id"])
    token = _create_token(user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut(
            id=user_id,
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"],
        ),
    }
