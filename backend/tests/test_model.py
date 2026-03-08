"""
tests/test_model.py — Unit tests for SignModel load/predict behaviour.
"""
import pickle
import tempfile
from pathlib import Path

import numpy as np
import pytest
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder

from app.model import SignModel


def _make_tmp_model(path: Path) -> None:
    """Write a minimal valid model pickle to *path*."""
    X = np.random.rand(60, 63).astype(np.float32)
    labels = ["HI"] * 10 + ["HELLO"] * 10 + ["YES"] * 10 + ["NO"] * 10 + ["PLEASE"] * 10 + ["I LOVE YOU"] * 10
    enc = LabelEncoder()
    y   = enc.fit_transform(labels)
    clf = GradientBoostingClassifier(n_estimators=10, max_depth=2, random_state=0)
    clf.fit(X, y)
    with open(path, "wb") as f:
        pickle.dump({"clf": clf, "enc": enc, "trained": True}, f)


# ── Missing model file ─────────────────────────────────────────────────────
def test_load_missing_file_returns_false():
    m = SignModel()
    assert m.load(Path("/nonexistent/path/model.pkl")) is False
    assert m.loaded is False


# ── Corrupt model file ─────────────────────────────────────────────────────
def test_load_corrupt_file_returns_false(tmp_path):
    bad = tmp_path / "bad.pkl"
    bad.write_bytes(b"this is not a pickle")
    m = SignModel()
    assert m.load(bad) is False


# ── Predict before load ────────────────────────────────────────────────────
def test_predict_before_load_returns_none():
    m = SignModel()
    label, conf = m.predict(np.zeros(63, dtype=np.float32))
    assert label is None
    assert conf == 0.0


# ── Successful load and predict ───────────────────────────────────────────
def test_load_and_predict(tmp_path):
    model_path = tmp_path / "model.pkl"
    _make_tmp_model(model_path)

    m = SignModel()
    result = m.load(model_path)
    assert result is True
    assert m.loaded is True

    features = np.random.rand(63).astype(np.float32)
    label, conf = m.predict(features)
    assert isinstance(label, str)
    assert 0.0 <= conf <= 1.0
