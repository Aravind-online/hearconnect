"""
app/config.py — All configuration loaded from environment with safe defaults.
Copy backend/.env.example to backend/.env and adjust values.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env if present (does nothing when running in production with real env vars)
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")


def _list(val: str) -> list[str]:
    """Parse comma-separated string into a list, stripping whitespace."""
    return [v.strip() for v in val.split(",") if v.strip()]


# ── Paths ──────────────────────────────────────────────────────────────────
MODEL_PATH = _ROOT / os.getenv("MODEL_PATH", "sign6_model.pkl")
DATA_PATH  = _ROOT / os.getenv("DATA_PATH",  "sign6_data.pkl")

# ── ML / Inference ─────────────────────────────────────────────────────────
SIGNS: list[str] = _list(os.getenv(
    "SIGNS", "HI,HELLO,I LOVE YOU,YES,NO,PLEASE"
))
CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.75"))
SMOOTH_FRAMES:        int   = int(os.getenv("SMOOTH_FRAMES", "20"))
SAMPLES_PER_SIGN:     int   = int(os.getenv("SAMPLES_PER_SIGN", "300"))

# ── TTS ────────────────────────────────────────────────────────────────────
SPEAK_COOLDOWN: float = float(os.getenv("SPEAK_COOLDOWN", "3.0"))

# ── WebSocket ──────────────────────────────────────────────────────────────
# Maximum bytes accepted per frame message (prevent memory exhaustion)
MAX_FRAME_BYTES: int = int(os.getenv("MAX_FRAME_BYTES", str(1024 * 512)))  # 512 KB

# ── Server ─────────────────────────────────────────────────────────────────
HOST:       str       = os.getenv("HOST", "0.0.0.0")
PORT:       int       = int(os.getenv("PORT", "8000"))
LOG_LEVEL:  str       = os.getenv("LOG_LEVEL", "info")

# Comma-separated list of allowed origins.  Use "*" only during local dev.
CORS_ORIGINS: list[str] = _list(os.getenv("CORS_ORIGINS", "http://localhost:3000"))

# ── MongoDB ────────────────────────────────────────────────────────────────
MONGODB_URL:     str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "hearconnect")

# ── JWT (Authentication) ───────────────────────────────────────────────────
# Change JWT_SECRET to a long random string in production!
JWT_SECRET:         str = os.getenv("JWT_SECRET", "change-me-in-production-use-a-long-random-string")
JWT_ALGORITHM:      str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 hours
