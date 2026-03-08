"""
app/model.py — Sign language model: load, predict.
Training is handled separately in train.py.
"""
import pickle
from pathlib import Path

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder


class SignModel:
    """Loads a trained GBM classifier from disk and runs inference."""

    def __init__(self) -> None:
        self.clf:     GradientBoostingClassifier | None = None
        self.encoder: LabelEncoder | None               = None
        self.loaded:  bool                              = False

    # ------------------------------------------------------------------
    def load(self, path: Path) -> bool:
        """
        Load model from *path*.  Returns True on success, False on failure.
        Raises nothing — caller receives a clear False so it can surface the
        error through the API.
        """
        if not path.exists():
            print(f"[model] ❌  Model file not found: {path}")
            print("            Train first:  python train.py --train")
            return False

        try:
            with open(path, "rb") as f:
                data = pickle.load(f)          # nosec: model files are local/trusted

            self.clf     = data["clf"]
            self.encoder = data["enc"]
            self.loaded  = data.get("trained", True)
            print(f"[model] ✅  Model loaded ← {path}")
            return True

        except Exception as exc:
            print(f"[model] ❌  Failed to load model: {exc}")
            return False

    # ------------------------------------------------------------------
    def predict(self, features: np.ndarray) -> tuple[str | None, float]:
        """
        Return (label, confidence).  Returns (None, 0.0) when not loaded.
        """
        if not self.loaded or self.clf is None or self.encoder is None:
            return None, 0.0

        proba = self.clf.predict_proba([features])[0]
        idx   = int(np.argmax(proba))
        label = self.encoder.inverse_transform([idx])[0]
        return str(label), float(proba[idx])
