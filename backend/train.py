"""
train.py — CLI for sign data collection and model training.

Usage:
    python train.py --collect      # collect webcam samples for each sign
    python train.py --train        # train model from saved data
    python train.py --collect --train   # do both in one run
    python train.py --recognize    # run live recognition (desktop / OpenCV window)
"""
import argparse
import os
import pickle
import time
from collections import Counter, deque

import cv2
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from app.config import (
    CONFIDENCE_THRESHOLD,
    DATA_PATH,
    MODEL_PATH,
    SAMPLES_PER_SIGN,
    SIGNS,
    SMOOTH_FRAMES,
    SPEAK_COOLDOWN,
)
from app.extractor import Extractor
from app.speech import SpeechWorker


# ─────────────────────────────────────────────────────────────────────────────
# Data collection
# ─────────────────────────────────────────────────────────────────────────────
def collect_data(extractor: Extractor) -> tuple[np.ndarray, np.ndarray]:
    X: list[np.ndarray] = []
    y: list[str]        = []

    if DATA_PATH.exists():
        with open(DATA_PATH, "rb") as f:
            saved = pickle.load(f)  # nosec: local file
        X, y = list(saved["X"]), list(saved["y"])
        print(f"Loaded {len(X)} existing samples from {DATA_PATH}.")

    for sign in SIGNS:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌  Cannot open webcam.")
            break

        collected, started = 0, False
        print(f"\n── {sign} ──  Show the sign and press SPACE to start recording. Q to skip.")

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            feats, _ = extractor.get_features(rgb)

            # Visually annotate the frame
            color = (0, 255, 80) if started else (0, 200, 255)
            label = f"[{sign}]  {'Recording…' if started else 'Press SPACE'}  {collected}/{SAMPLES_PER_SIGN}"
            cv2.putText(frame, label, (10, 45), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            cv2.imshow("Collect Data", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord(" "):
                started = True
            if key == ord("q"):
                break

            if started and feats is not None:
                X.append(feats)
                y.append(sign)
                collected += 1
                if collected >= SAMPLES_PER_SIGN:
                    print(f"  ✓ Done collecting '{sign}' ({collected} samples)")
                    break

        cap.release()
        cv2.destroyAllWindows()

    X_arr = np.array(X)
    y_arr = np.array(y)

    with open(DATA_PATH, "wb") as f:
        pickle.dump({"X": X_arr, "y": y_arr}, f)
    print(f"\nData saved → {DATA_PATH}  ({len(X)} total samples)")

    return X_arr, y_arr


# ─────────────────────────────────────────────────────────────────────────────
# Training
# ─────────────────────────────────────────────────────────────────────────────
def train_model(X: np.ndarray, y: np.ndarray) -> None:
    encoder = LabelEncoder()
    ye      = encoder.fit_transform(y)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, ye, test_size=0.15, random_state=42, stratify=ye
    )

    print(f"\nTraining on {len(X_tr)} samples…")
    clf = GradientBoostingClassifier(n_estimators=200, max_depth=5, random_state=42)
    clf.fit(X_tr, y_tr)

    acc = accuracy_score(y_te, clf.predict(X_te))
    print(f"✅  Accuracy: {acc * 100:.1f}%")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"clf": clf, "enc": encoder, "trained": True}, f)
    print(f"Model saved → {MODEL_PATH}")


# ─────────────────────────────────────────────────────────────────────────────
# Live recognition (standalone / desktop mode)
# ─────────────────────────────────────────────────────────────────────────────
def run_recognition(extractor: Extractor) -> None:
    if not MODEL_PATH.exists():
        print("❌  No trained model found. Run:  python train.py --train")
        return

    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)  # nosec: local file
    clf, encoder = data["clf"], data["enc"]

    speech      = SpeechWorker()
    buf         = deque(maxlen=SMOOTH_FRAMES)
    last_spoken = ""
    last_speak_t = 0.0

    sign_colors = {
        "HI":        (255, 200,   0),
        "HELLO":     (  0, 255, 180),
        "I LOVE YOU":(255,  80, 150),
        "YES":       ( 80, 255,  80),
        "NO":        ( 80,  80, 255),
        "PLEASE":    (255, 160,   0),
    }

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    print("\n🎥  Recognition running — Q to quit\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        h, w  = frame.shape[:2]
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        feats, _ = extractor.get_features(rgb)
        label, conf = None, 0.0

        if feats is not None:
            proba     = clf.predict_proba([feats])[0]
            idx       = int(np.argmax(proba))
            raw_label = encoder.inverse_transform([idx])[0]
            buf.append((raw_label, float(proba[idx])))
        else:
            buf.clear()

        if len(buf) >= SMOOTH_FRAMES // 2:
            labels_buf, confs_buf = zip(*buf)
            label = Counter(labels_buf).most_common(1)[0][0]
            conf  = float(np.mean([c for l, c in zip(labels_buf, confs_buf) if l == label]))

        now = time.time()
        if (
            label and conf >= CONFIDENCE_THRESHOLD
            and (label != last_spoken or now - last_speak_t > SPEAK_COOLDOWN)
        ):
            print(f"🔊  {label}  ({conf * 100:.0f}%)")
            speech.say(label)
            last_spoken  = label
            last_speak_t = now

        # UI overlay
        cv2.rectangle(frame, (0, 0), (w, 95), (15, 15, 15), -1)
        if label and conf >= CONFIDENCE_THRESHOLD:
            clr   = sign_colors.get(label, (255, 255, 255))
            bar_w = int((w - 30) * conf)
            cv2.putText(frame, label, (15, 70), cv2.FONT_HERSHEY_SIMPLEX, 2.2, clr, 4)
            cv2.rectangle(frame, (15, 80), (15 + bar_w, 90), clr, -1)
            cv2.rectangle(frame, (15, 80), (w - 15, 90), (80, 80, 80), 1)
        elif feats is None:
            cv2.putText(frame, "No hand detected", (15, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (80, 80, 80), 2)
        else:
            cv2.putText(frame, f"Low confidence {conf * 100:.0f}%", (15, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 140, 255), 2)

        for i, s in enumerate(SIGNS):
            cv2.putText(frame, s, (w - 210, h - 15 - i * 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, sign_colors.get(s, (255, 255, 255)), 2)

        cv2.imshow("Sign Language → Speech", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    speech.stop()
    cap.release()
    cv2.destroyAllWindows()


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="Hearconnet training CLI")
    parser.add_argument("--collect",   action="store_true", help="Collect training data via webcam")
    parser.add_argument("--train",     action="store_true", help="Train model from saved data")
    parser.add_argument("--recognize", action="store_true", help="Run live desktop recognition")
    args = parser.parse_args()

    extractor = Extractor()

    try:
        if not (args.collect or args.train or args.recognize):
            parser.print_help()
            return

        X, y = None, None

        if args.collect:
            X, y = collect_data(extractor)

        if args.train:
            if X is None:
                if not DATA_PATH.exists():
                    print(f"❌  No data found at {DATA_PATH}. Run with --collect first.")
                    return
                with open(DATA_PATH, "rb") as f:
                    saved = pickle.load(f)  # nosec: local file
                X, y = saved["X"], saved["y"]
            train_model(X, y)
            print("\nDone! Start the server:  python -m uvicorn app.main:app --port 8000")

        if args.recognize:
            run_recognition(extractor)
    finally:
        extractor.close()


if __name__ == "__main__":
    main()
