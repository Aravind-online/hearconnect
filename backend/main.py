
import cv2
import mediapipe as mp
import numpy as np
import pyttsx3
import pickle
import os
import time
import argparse
import threading
import queue
from collections import deque, Counter
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

SIGNS = ["HI", "HELLO", "I LOVE YOU", "YES", "NO", "PLEASE"]

MODEL_PATH = "sign6_model.pkl"
DATA_PATH  = "sign6_data.pkl"
SAMPLES_PER_SIGN     = 300
CONFIDENCE_THRESHOLD = 0.75
SMOOTH_FRAMES        = 20
SPEAK_COOLDOWN       = 3.0   # seconds before same sign repeats


# ────────────────────────────────────────────────────────────
# THREADED SPEECH ENGINE  ← the fix
# ────────────────────────────────────────────────────────────
class SpeechWorker:
    """
    Runs pyttsx3 in its own thread so it never freezes the camera.
    Just call .say("text") from anywhere.
    """
    def __init__(self):
        self._q = queue.Queue()
        self._t = threading.Thread(target=self._worker, daemon=True)
        self._t.start()

    def _worker(self):
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.setProperty("volume", 1.0)
        # Pick clearest English voice available
        voices = engine.getProperty("voices")
        for v in voices:
            if "english" in v.name.lower() or "zira" in v.name.lower() or "david" in v.name.lower():
                engine.setProperty("voice", v.id)
                break
        while True:
            text = self._q.get()
            if text is None:
                break
            engine.say(text)
            engine.runAndWait()

    def say(self, text):
        # Clear any pending words so we never queue up a backlog
        while not self._q.empty():
            try: self._q.get_nowait()
            except: pass
        self._q.put(text)

    def stop(self):
        self._q.put(None)


# ────────────────────────────────────────────────────────────
# MEDIAPIPE EXTRACTOR
# ────────────────────────────────────────────────────────────
class Extractor:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_draw  = mp.solutions.drawing_utils
        self.mp_style = mp.solutions.drawing_styles
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.6,
        )

    def get_features(self, rgb_frame):
        results = self.hands.process(rgb_frame)
        if not results.multi_hand_landmarks:
            return None, results
        lm = results.multi_hand_landmarks[0].landmark
        wrist = lm[0]
        coords = []
        for pt in lm:
            coords += [pt.x - wrist.x, pt.y - wrist.y, pt.z - wrist.z]
        return np.array(coords, dtype=np.float32), results

    def draw(self, frame, results):
        if results.multi_hand_landmarks:
            for hl in results.multi_hand_landmarks:
                self.mp_draw.draw_landmarks(
                    frame, hl,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_style.get_default_hand_landmarks_style(),
                    self.mp_style.get_default_hand_connections_style(),
                )


# ────────────────────────────────────────────────────────────
# MODEL
# ────────────────────────────────────────────────────────────
class Model:
    def __init__(self):
        self.clf     = GradientBoostingClassifier(n_estimators=200, max_depth=5, random_state=42)
        self.encoder = LabelEncoder()
        self.trained = False

    def train(self, X, y):
        ye = self.encoder.fit_transform(y)
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, ye, test_size=0.15, random_state=42, stratify=ye)
        print(f"\nTraining on {len(X_tr)} samples…")
        self.clf.fit(X_tr, y_tr)
        acc = accuracy_score(y_te, self.clf.predict(X_te))
        print(f"✅ Accuracy: {acc*100:.1f}%")
        self.trained = True

    def predict(self, features):
        if not self.trained:
            return None, 0.0
        proba = self.clf.predict_proba([features])[0]
        idx   = np.argmax(proba)
        return self.encoder.inverse_transform([idx])[0], proba[idx]

    def save(self):
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"clf": self.clf, "enc": self.encoder, "trained": self.trained}, f)
        print(f"Model saved → {MODEL_PATH}")

    def load(self):
        with open(MODEL_PATH, "rb") as f:
            d = pickle.load(f)
        self.clf, self.encoder, self.trained = d["clf"], d["enc"], d["trained"]
        print(f"Model loaded ← {MODEL_PATH}")


# ────────────────────────────────────────────────────────────
# DATA COLLECTION
# ────────────────────────────────────────────────────────────
def collect_data(extractor):
    X, y = [], []
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "rb") as f:
            d = pickle.load(f)
        X, y = list(d["X"]), list(d["y"])
        print(f"Loaded {len(X)} existing samples.")

    for sign in SIGNS:
        cap = cv2.VideoCapture(0)
        collected, started = 0, False
        print(f"\n── {sign} ──  Show the sign and press SPACE to record. Q to skip.")

        while True:
            ret, frame = cap.read()
            if not ret: break
            frame = cv2.flip(frame, 1)
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            feats, results = extractor.get_features(rgb)
            extractor.draw(frame, results)

            msg   = f"[{sign}]  {'Recording…' if started else 'Press SPACE'}  {collected}/{SAMPLES_PER_SIGN}"
            color = (0, 255, 80) if started else (0, 200, 255)
            cv2.putText(frame, msg, (10, 45), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            cv2.imshow("Collect Data", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord(" "): started = True
            if key == ord("q"): break

            if started and feats is not None:
                X.append(feats); y.append(sign)
                collected += 1
                if collected >= SAMPLES_PER_SIGN:
                    print(f"  ✓ Done collecting '{sign}'")
                    break

        cap.release()
        cv2.destroyAllWindows()

    with open(DATA_PATH, "wb") as f:
        pickle.dump({"X": np.array(X), "y": np.array(y)}, f)
    print(f"\nData saved → {DATA_PATH}  ({len(X)} total samples)")
    return np.array(X), np.array(y)


# ────────────────────────────────────────────────────────────
# REAL-TIME RECOGNITION 
# ────────────────────────────────────────────────────────────
def run_recognition(model, extractor):
    speech = SpeechWorker()   # ← threaded, never blocks camera

    buf          = deque(maxlen=SMOOTH_FRAMES)
    last_spoken  = ""
    last_speak_t = 0

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
    print("\n🎥 Recognition running.  Q = quit\n")

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)
        h, w  = frame.shape[:2]
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        feats, results = extractor.get_features(rgb)
        extractor.draw(frame, results)

        # ── Prediction + smoothing ───────────────────────
        label, conf = None, 0.0
        if feats is not None:
            rl, rc = model.predict(feats)
            buf.append((rl, rc))

        if len(buf) >= SMOOTH_FRAMES // 2:
            labels_buf, confs_buf = zip(*buf)
            label = Counter(labels_buf).most_common(1)[0][0]
            conf  = float(np.mean([c for l, c in zip(labels_buf, confs_buf) if l == label]))

        # ── Speak (threaded, non-blocking) ───────────────
        now = time.time()
        if (label and conf >= CONFIDENCE_THRESHOLD
                and (label != last_spoken or now - last_speak_t > SPEAK_COOLDOWN)):
            print(f"🔊  {label}  ({conf*100:.0f}%)")
            speech.say(label)
            last_spoken  = label
            last_speak_t = now

        # ── Draw UI ──────────────────────────────────────
        cv2.rectangle(frame, (0, 0), (w, 95), (15, 15, 15), -1)

        if label and conf >= CONFIDENCE_THRESHOLD:
            clr = sign_colors.get(label, (255, 255, 255))
            cv2.putText(frame, label, (15, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 2.2, clr, 4)
            bar_w = int((w - 30) * conf)
            cv2.rectangle(frame, (15, 80), (15 + bar_w, 90), clr, -1)
            cv2.rectangle(frame, (15, 80), (w - 15, 90), (80, 80, 80), 1)
        elif feats is None:
            cv2.putText(frame, "No hand detected", (15, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (80, 80, 80), 2)
        else:
            cv2.putText(frame, f"Low confidence {conf*100:.0f}%", (15, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 140, 255), 2)

        # Sign legend bottom-right
        for i, s in enumerate(SIGNS):
            cv2.putText(frame, s, (w - 210, h - 15 - i * 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, sign_colors[s], 2)

        cv2.imshow("Sign Language → Speech", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    speech.stop()
    cap.release()
    cv2.destroyAllWindows()


# ────────────────────────────────────────────────────────────
# MAIN 
# ────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", action="store_true")
    args = parser.parse_args()

    extractor = Extractor()
    model     = Model()

    if args.train:
        X, y = collect_data(extractor)
        model.train(X, y)
        model.save()
        print("\nDone! Now run without --train to start recognizing.")
    else:
        if not os.path.exists(MODEL_PATH):
            print("❌  No trained model found.")
            print("    Run:  python main.py --train")
            return
        model.load()
        run_recognition(model, extractor)

if __name__ == "__main__":
    main()