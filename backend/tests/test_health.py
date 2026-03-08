"""
tests/test_health.py — Health endpoint contract tests.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    r = client.get("/health")
    assert r.status_code == 200


def test_health_shape():
    r = client.get("/health")
    body = r.json()
    required_keys = {"status", "model_loaded", "speech", "signs", "threshold", "smooth_frames"}
    assert required_keys.issubset(body.keys())


def test_health_status_ok():
    r = client.get("/health")
    assert r.json()["status"] == "ok"


def test_health_model_loaded_is_bool():
    r = client.get("/health")
    assert isinstance(r.json()["model_loaded"], bool)


def test_health_signs_is_list():
    r = client.get("/health")
    assert isinstance(r.json()["signs"], list)
    assert len(r.json()["signs"]) > 0
