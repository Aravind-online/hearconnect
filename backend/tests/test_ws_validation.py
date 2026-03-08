"""
tests/test_ws_validation.py — WebSocket edge-case acceptance tests.

Tests cover:
 - Empty payload
 - Oversized payload rejection
 - Invalid base64 string
 - Valid frame with no hand returns hand_detected=false
"""
import base64
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def ws_client():
    with TestClient(app) as c:
        yield c


def _make_blank_frame_b64(width: int = 320, height: int = 240) -> str:
    """Create a black JPEG frame and return it as base64 string."""
    import cv2
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
    return base64.b64encode(buf.tobytes()).decode()


# ── Empty payload ──────────────────────────────────────────────────────────
def test_ws_empty_payload(ws_client):
    with ws_client.websocket_connect("/ws/sign") as ws:
        ws.send_json({"frame": ""})
        data = ws.receive_json()
        assert "error" in data


# ── Oversized payload ──────────────────────────────────────────────────────
def test_ws_oversized_payload(ws_client):
    from app.config import MAX_FRAME_BYTES
    big_payload = "A" * (MAX_FRAME_BYTES + 1)
    with ws_client.websocket_connect("/ws/sign") as ws:
        ws.send_json({"frame": big_payload})
        data = ws.receive_json()
        assert "error" in data
        assert "too large" in data["error"].lower()


# ── Invalid base64 ─────────────────────────────────────────────────────────
def test_ws_invalid_base64(ws_client):
    with ws_client.websocket_connect("/ws/sign") as ws:
        ws.send_json({"frame": "!!!not-valid-base64!!!"})
        data = ws.receive_json()
        assert "error" in data


# ── Valid blank frame (no hand) ────────────────────────────────────────────
def test_ws_blank_frame_no_hand(ws_client):
    b64 = _make_blank_frame_b64()
    with ws_client.websocket_connect("/ws/sign") as ws:
        ws.send_json({"frame": b64})
        data = ws.receive_json()
        assert "hand_detected" in data
        assert data["hand_detected"] is False
        # sign must be None when no hand — never a stale label
        assert data.get("sign") is None


# ── Result schema after valid frame ───────────────────────────────────────
def test_ws_result_schema(ws_client):
    b64 = _make_blank_frame_b64()
    with ws_client.websocket_connect("/ws/sign") as ws:
        ws.send_json({"frame": b64})
        data = ws.receive_json()
        for key in ("hand_detected", "confidence", "threshold", "raw_sign", "sign"):
            assert key in data, f"Missing key: {key}"
        assert 0.0 <= data["confidence"] <= 1.0
