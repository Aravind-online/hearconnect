"""
tests/test_ws_buffer.py — Verify stale prediction is NOT emitted after hand leaves frame.
"""
import base64
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app


def _blank_b64(width: int = 320, height: int = 240) -> str:
    import cv2
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", frame)
    return base64.b64encode(buf.tobytes()).decode()


def test_stale_sign_cleared_after_hand_disappears():
    """
    After the hand disappears for NO_HAND_FLUSH_AFTER consecutive frames,
    the sign result must be None — not a stale label from the buffer.
    """
    from app.config import SMOOTH_FRAMES

    flush_threshold = SMOOTH_FRAMES // 2
    blank = _blank_b64()

    with TestClient(app) as client:
        with client.websocket_connect("/ws/sign") as ws:
            # Send enough blank (no-hand) frames to trigger buffer flush
            last_data = None
            for _ in range(flush_threshold + 2):
                ws.send_json({"frame": blank})
                last_data = ws.receive_json()

            assert last_data is not None
            # After multiple no-hand frames, sign must be None
            assert last_data.get("sign") is None, (
                f"Expected sign=None after hand disappears, got: {last_data}"
            )
