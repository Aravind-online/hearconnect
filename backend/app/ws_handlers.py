"""
app/ws_handlers.py — WebSocket endpoint for live sign detection.

Per-connection lifecycle:
  1. Receive base64 JPEG frame from React.
  2. Validate size before decoding.
  3. Extract hand features with MediaPipe.
  4. Predict + smooth over N frames.
  5. Reset smoothing buffer when hand disappears.
  6. Trigger TTS & deduplicate within cooldown window.
  7. Send JSON result back to React.
"""
import base64
import binascii
import json
import time
from collections import Counter, deque

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect

from app.config import (
    CONFIDENCE_THRESHOLD,
    MAX_FRAME_BYTES,
    SMOOTH_FRAMES,
    SPEAK_COOLDOWN,
)
from app.extractor import Extractor
from app.model import SignModel
from app.speech import SpeechWorker


async def sign_ws(
    ws: WebSocket,
    extractor: Extractor,
    sign_model: SignModel,
    speech_worker: SpeechWorker,
) -> None:
    """Handle one WebSocket client connection for sign detection."""
    await ws.accept()
    client = ws.client
    print(f"[ws] 🔗  Client connected: {client.host}:{client.port}")  # type: ignore[union-attr]

    # Per-connection prediction state
    buf:          deque[tuple[str, float]] = deque(maxlen=SMOOTH_FRAMES)
    last_spoken:  str   = ""
    last_speak_t: float = 0.0
    frames_no_hand: int = 0  # counts consecutive no-hand frames

    # After this many consecutive no-hand frames we flush the buffer
    NO_HAND_FLUSH_AFTER = SMOOTH_FRAMES // 2

    try:
        while True:
            # ── 1. Receive ────────────────────────────────────────────────
            raw = await ws.receive_text()

            # ── 2. Parse & size-guard ─────────────────────────────────────
            try:
                payload = json.loads(raw)
                b64: str = payload.get("frame", "")
            except (json.JSONDecodeError, AttributeError):
                b64 = raw  # tolerate plain base64 string

            if len(b64) > MAX_FRAME_BYTES:
                await ws.send_text(json.dumps({
                    "error": f"Frame payload too large ({len(b64)} bytes, max {MAX_FRAME_BYTES})."
                }))
                continue

            if not b64:
                await ws.send_text(json.dumps({"error": "Empty frame payload."}))
                continue

            # ── 3. Decode base64 JPEG → RGB numpy array ───────────────────
            try:
                img_bytes = base64.b64decode(b64, validate=True)
                arr  = np.frombuffer(img_bytes, dtype=np.uint8)
                bgr  = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if bgr is None:
                    raise ValueError("cv2.imdecode returned None — not a valid image.")
                rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            except (binascii.Error, ValueError) as exc:
                await ws.send_text(json.dumps({"error": f"Frame decode failed: {exc}"}))
                continue

            # ── 4. Extract features ───────────────────────────────────────
            features, hand_detected = extractor.get_features(rgb)

            # ── 5. Predict + buffer management ───────────────────────────
            if hand_detected and sign_model.loaded:
                raw_label, raw_conf = sign_model.predict(features)  # type: ignore[arg-type]
                buf.append((raw_label, raw_conf))  # type: ignore[arg-type]
                frames_no_hand = 0
            else:
                frames_no_hand += 1
                if frames_no_hand >= NO_HAND_FLUSH_AFTER:
                    buf.clear()   # flush stale predictions when hand gone
                    frames_no_hand = 0

            # ── 6. Smooth predictions ─────────────────────────────────────
            smoothed_label: str | None = None
            smoothed_conf:  float      = 0.0

            if len(buf) >= SMOOTH_FRAMES // 2:
                labels_list, confs_list = zip(*buf)
                smoothed_label = Counter(labels_list).most_common(1)[0][0]
                smoothed_conf  = float(np.mean(
                    [c for lbl, c in zip(labels_list, confs_list) if lbl == smoothed_label]
                ))

            # ── 7. TTS with cooldown deduplication ────────────────────────
            now = time.time()
            if (
                smoothed_label
                and smoothed_conf >= CONFIDENCE_THRESHOLD
                and (smoothed_label != last_spoken or now - last_speak_t > SPEAK_COOLDOWN)
            ):
                speech_worker.say(smoothed_label)
                last_spoken  = smoothed_label
                last_speak_t = now
                print(f"[ws] 🔊  {smoothed_label}  ({smoothed_conf * 100:.0f}%)")

            # ── 8. Send result to React ───────────────────────────────────
            await ws.send_text(json.dumps({
                "sign":          smoothed_label if (smoothed_conf >= CONFIDENCE_THRESHOLD) else None,
                "raw_sign":      smoothed_label,
                "confidence":    round(smoothed_conf, 4),
                "hand_detected": hand_detected,
                "threshold":     CONFIDENCE_THRESHOLD,
            }))

    except WebSocketDisconnect:
        print(f"[ws] 🔌  Client disconnected: {client.host}:{client.port}")  # type: ignore[union-attr]
    except Exception as exc:
        print(f"[ws] ⚠   Unexpected error: {exc}")
    finally:
        buf.clear()
