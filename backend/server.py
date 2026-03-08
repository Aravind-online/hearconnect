"""
╔══════════════════════════════════════════════════════════════╗
║          HEARCONNET — server.py                              ║
║  FastAPI WebSocket bridge between main.py and React UI       ║
╠══════════════════════════════════════════════════════════════╣
║  FOLDER STRUCTURE (put all files in same folder):            ║
║    hearconnet/                                               ║
║      ├── main.py          ← your sign language ML code       ║
║      ├── server.py        ← THIS FILE                        ║
║      ├── sign6_model.pkl  ← created after training           ║
║      └── sign6_data.pkl   ← created after training           ║
║                                                              ║
║  INSTALL:                                                    ║
║    pip install fastapi uvicorn websockets opencv-python      ║
║                mediapipe scikit-learn pyttsx3 numpy pillow   ║
║                                                              ║
║  RUN ORDER:                                                  ║
║    1. python main.py --train   (only once to train model)    ║
║    2. python server.py         (start this bridge server)    ║
║    3. npm start                (start React on port 3000)    ║
╚══════════════════════════════════════════════════════════════╝
"""

import asyncio
import base64
import json
import os
import pickle
import queue
import threading
import time
from collections import Counter, deque

import cv2
import mediapipe as mp
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ── Optional pyttsx3 (server-side TTS) ──────────────────────────────────────
try:
    import pyttsx3
    SPEECH_OK = True
except ImportError:
    SPEECH_OK = False
    print("⚠  pyttsx3 not installed — server-side TTS disabled (browser TTS still works)")

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG  (must match main.py)
# ─────────────────────────────────────────────────────────────────────────────
MODEL_PATH           = "sign6_model.pkl"
SIGNS                = ["HI", "HELLO", "I LOVE YOU", "YES", "NO", "PLEASE"]
CONFIDENCE_THRESHOLD = 0.75
SMOOTH_FRAMES        = 20
SPEAK_COOLDOWN       = 3.0   # seconds before same word repeats via TTS


# ─────────────────────────────────────────────────────────────────────────────
# THREADED TTS WORKER  — identical pattern to main.py so speech never blocks
# ─────────────────────────────────────────────────────────────────────────────
class SpeechWorker:
    def __init__(self):
        self._q = queue.Queue()
        if SPEECH_OK:
            t = threading.Thread(target=self._run, daemon=True)
            t.start()

    def _run(self):
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.setProperty("volume", 1.0)
        # Pick the clearest English voice available
        for v in engine.getProperty("voices"):
            if any(k in v.name.lower() for k in ("english", "zira", "david")):
                engine.setProperty("voice", v.id)
                break
        while True:
            text = self._q.get()
            if text is None:
                break
            engine.say(text)
            engine.runAndWait()

    def say(self, text: str):
        if not SPEECH_OK:
            return
        # Flush backlog so we never queue up old words
        while not self._q.empty():
            try:
                self._q.get_nowait()
            except queue.Empty:
                pass
        self._q.put(text)

    def stop(self):
        if SPEECH_OK:
            self._q.put(None)


# ─────────────────────────────────────────────────────────────────────────────
# MEDIAPIPE FEATURE EXTRACTOR  — same logic as main.py Extractor class
# ─────────────────────────────────────────────────────────────────────────────
class Extractor:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.6,
        )

    def get_features(self, rgb_frame: np.ndarray):
        """
        Returns (feature_vector, hand_detected).
        feature_vector is 63-dim numpy array (21 landmarks × 3 coords)
        relative to the wrist — exactly what main.py trains on.
        """
        results = self.hands.process(rgb_frame)
        if not results.multi_hand_landmarks:
            return None, False

        lm = results.multi_hand_landmarks[0].landmark
        wrist = lm[0]
        coords = []
        for pt in lm:
            coords += [pt.x - wrist.x, pt.y - wrist.y, pt.z - wrist.z]
        return np.array(coords, dtype=np.float32), True


# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADER  — loads sign6_model.pkl saved by main.py
# ─────────────────────────────────────────────────────────────────────────────
class SignModel:
    def __init__(self):
        self.clf     = None
        self.encoder = None
        self.loaded  = False

    def load(self) -> bool:
        if not os.path.exists(MODEL_PATH):
            print(f"\n❌  Model file '{MODEL_PATH}' not found!")
            print("    Train first:  python main.py --train\n")
            return False
        try:
            with open(MODEL_PATH, "rb") as f:
                d = pickle.load(f)
            self.clf     = d["clf"]
            self.encoder = d["enc"]
            self.loaded  = d.get("trained", True)
            print(f"✅  Model loaded  ←  {MODEL_PATH}")
            return True
        except Exception as e:
            print(f"❌  Failed to load model: {e}")
            return False

    def predict(self, features: np.ndarray):
        """Returns (label_string, confidence_float)"""
        if not self.loaded:
            return None, 0.0
        proba = self.clf.predict_proba([features])[0]
        idx   = int(np.argmax(proba))
        label = self.encoder.inverse_transform([idx])[0]
        return label, float(proba[idx])


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APPLICATION
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Hearconnet Sign Language API", version="1.0.0")

# Allow React dev server (port 3000) and any other origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared singletons — created once at startup
extractor     = Extractor()
sign_model    = SignModel()
speech_worker = SpeechWorker()


@app.on_event("startup")
async def startup_event():
    print("\n🚀  Hearconnet server starting…")
    sign_model.load()
    print(f"🎤  Server-side TTS: {'enabled' if SPEECH_OK else 'disabled'}")
    print(f"🌐  WebSocket endpoint: ws://localhost:8000/ws/sign")
    print(f"❤️   Health check:      http://localhost:8000/health\n")


# ── Health check endpoint — React pings this on page load ────────────────────
@app.get("/health")
async def health():
    return {
        "status":       "ok",
        "model_loaded": sign_model.loaded,
        "speech":       SPEECH_OK,
        "signs":        SIGNS,
        "threshold":    CONFIDENCE_THRESHOLD,
        "smooth_frames":SMOOTH_FRAMES,
    }


# ─────────────────────────────────────────────────────────────────────────────
# WEBSOCKET ENDPOINT
# React sends:  { "frame": "<base64 JPEG>" }
# Server sends: { "sign": "HELLO", "confidence": 0.94,
#                 "raw_sign": "HELLO", "hand_detected": true }
# ─────────────────────────────────────────────────────────────────────────────
@app.websocket("/ws/sign")
async def sign_ws(ws: WebSocket):
    await ws.accept()
    client = ws.client
    print(f"🔗  Client connected: {client.host}:{client.port}")

    # Per-connection state
    buf          = deque(maxlen=SMOOTH_FRAMES)
    last_spoken  = ""
    last_speak_t = 0.0

    try:
        while True:
            # ── 1. Receive frame from React ──────────────────────────────
            raw = await ws.receive_text()

            try:
                payload = json.loads(raw)
                b64     = payload.get("frame", "")
            except Exception:
                b64 = raw  # fallback: plain base64 string

            # ── 2. Decode base64 JPEG → numpy BGR → RGB ──────────────────
            try:
                img_bytes = base64.b64decode(b64)
                arr = np.frombuffer(img_bytes, dtype=np.uint8)
                bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if bgr is None:
                    raise ValueError("cv2.imdecode returned None")
                rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            except Exception as e:
                await ws.send_text(json.dumps({"error": f"Frame decode failed: {e}"}))
                continue

            # ── 3. Extract hand features ─────────────────────────────────
            features, hand_detected = extractor.get_features(rgb)

            # ── 4. Predict ───────────────────────────────────────────────
            raw_label, raw_conf = None, 0.0
            if hand_detected and sign_model.loaded:
                raw_label, raw_conf = sign_model.predict(features)
                buf.append((raw_label, raw_conf))

            # ── 5. Smooth predictions over last N frames ─────────────────
            smoothed_label = None
            smoothed_conf  = 0.0
            if len(buf) >= SMOOTH_FRAMES // 2:
                labels_list, confs_list = zip(*buf)
                smoothed_label = Counter(labels_list).most_common(1)[0][0]
                smoothed_conf  = float(np.mean(
                    [c for l, c in zip(labels_list, confs_list) if l == smoothed_label]
                ))

            # ── 6. Server-side TTS (non-blocking, separate thread) ───────
            now = time.time()
            if (smoothed_label
                    and smoothed_conf >= CONFIDENCE_THRESHOLD
                    and (smoothed_label != last_spoken
                         or now - last_speak_t > SPEAK_COOLDOWN)):
                speech_worker.say(smoothed_label)
                last_spoken  = smoothed_label
                last_speak_t = now
                print(f"🔊  Detected: {smoothed_label}  ({smoothed_conf*100:.0f}%)")

            # ── 7. Send JSON result back to React ────────────────────────
            result = {
                # sign is None if confidence below threshold
                "sign":          smoothed_label if smoothed_conf >= CONFIDENCE_THRESHOLD else None,
                "raw_sign":      smoothed_label,
                "confidence":    round(smoothed_conf, 4),
                "hand_detected": hand_detected,
                "threshold":     CONFIDENCE_THRESHOLD,
            }
            await ws.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print(f"🔌  Client disconnected: {client.host}:{client.port}")
    except Exception as e:
        print(f"⚠   WebSocket error: {e}")
    finally:
        buf.clear()


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,          # set True during development if needed
        log_level="info",
    )
