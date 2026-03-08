"""
app/main.py — Unified FastAPI application entry point.
Replaces the old server.py and service.py (both are now obsolete).

Run:
    cd backend
    python -m uvicorn app.main:app --reload --port 8000
or simply:
    python run_server.py
"""
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.database import close_db, connect_db
from app.extractor import Extractor
from app.model import SignModel
from app.routers import auth, chat, history
from app.speech import SPEECH_AVAILABLE, SpeechWorker
from app.ws_handlers import sign_ws

# ── Application ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Hearconnet Sign Language API",
    version="2.0.0",
    description="WebSocket bridge: React webcam → MediaPipe → GBM → TTS",
)

# ── CORS (restrict origins in production) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(chat.router)

# ── Shared singletons (created once at startup) ────────────────────────────
_extractor:     Extractor    | None = None
_sign_model:    SignModel     | None = None
_speech_worker: SpeechWorker | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _extractor, _sign_model, _speech_worker

    print("\n🚀  Hearconnet server starting…")

    # Connect to MongoDB
    await connect_db()

    _extractor     = Extractor()
    _sign_model    = SignModel()
    _speech_worker = SpeechWorker()

    _sign_model.load(config.MODEL_PATH)

    print(f"🎤  Server TTS  : {'enabled' if SPEECH_AVAILABLE else 'disabled (pyttsx3 not installed)'}")
    print(f"🌐  WebSocket   : ws://{config.HOST}:{config.PORT}/ws/sign")
    print(f"❤️   Health check: http://{config.HOST}:{config.PORT}/health")
    print(f"🔒  CORS origins: {config.CORS_ORIGINS}\n")


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _extractor:
        _extractor.close()
    if _speech_worker:
        _speech_worker.stop()
    await close_db()
    print("👋  Hearconnet server stopped.")


# ── Routes ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health() -> dict:
    return {
        "status":        "ok",
        "model_loaded":  bool(_sign_model and _sign_model.loaded),
        "speech":        SPEECH_AVAILABLE,
        "signs":         config.SIGNS,
        "threshold":     config.CONFIDENCE_THRESHOLD,
        "smooth_frames": config.SMOOTH_FRAMES,
    }


@app.websocket("/ws/sign")
async def _ws_sign(ws: WebSocket) -> None:
    await sign_ws(
        ws,
        extractor=_extractor,        # type: ignore[arg-type]
        sign_model=_sign_model,      # type: ignore[arg-type]
        speech_worker=_speech_worker, # type: ignore[arg-type]
    )


# ── Direct execution ───────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,
        log_level=config.LOG_LEVEL,
    )
