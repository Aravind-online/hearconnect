# HearConnect

An AI-powered accessibility platform that bridges deaf, hearing-impaired, and hearing communities through real-time sign language detection, speech recognition, and text chat.

---

## Features

| Module                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| **Deaf ↔ Deaf Chat**              | Text messaging with zero audio dependency                     |
| **Sign Language → Text & Speech** | Webcam frames → MediaPipe landmarks → GBM model → spoken word |
| **Speech → Text**                 | Web Speech API live transcription for deaf readers            |

---

## Folder Structure

```
hearconnect-main/
├── backend/
│   ├── app/
│   │   ├── config.py          # Env-driven config (HOST, PORT, CORS_ORIGINS, …)
│   │   ├── extractor.py       # MediaPipe hand landmark extractor
│   │   ├── model.py           # GradientBoosting classifier wrapper
│   │   ├── speech.py          # pyttsx3 TTS worker thread
│   │   ├── ws_handlers.py     # WebSocket frame handler
│   │   └── main.py            # FastAPI app (REST + WebSocket)
│   ├── tests/
│   │   ├── test_health.py
│   │   ├── test_model.py
│   │   ├── test_ws_buffer.py
│   │   └── test_ws_validation.py
│   ├── train.py               # CLI: collect data / train model / live preview
│   ├── requirements.txt
│   └── .env.example
│
└── hearconnet-app/            # React 19 frontend
    └── src/
        ├── pages/             # One file per route
        ├── components/        # Shared UI components
        ├── hooks/             # useSignDetection, useSpeechRecognition, useAuthState
        ├── services/          # WS_URL / HEALTH_URL config + fetchHealth()
        ├── constants/         # SIGNS array + getSignMeta()
        ├── styles/            # Design tokens (T) + icon paths (I)
        ├── __tests__/         # Jest + RTL tests
        └── App.js             # Thin router (57 lines)
```

---

## Quick Start

### 1 — Install backend dependencies

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2 — Configure environment

```bash
cp .env.example .env   # Edit CORS_ORIGINS, MODEL_PATH, etc. as needed
```

### 3 — Collect training data (first run only)

```bash
# Shows webcam — press a key for each sign label
python train.py --collect
```

### 4 — Train the model

```bash
python train.py --train
# Outputs: model/sign_model.pkl
```

### 5 — Start the backend server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 6 — Start the frontend

```bash
cd ../hearconnet-app
npm install
npm start
# Opens http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable               | Default                 | Description                         |
| ---------------------- | ----------------------- | ----------------------------------- |
| `MODEL_PATH`           | `model/sign_model.pkl`  | Path to trained model file          |
| `DATA_PATH`            | `data/signs.csv`        | Path to training data CSV           |
| `HOST`                 | `0.0.0.0`               | Uvicorn bind host                   |
| `PORT`                 | `8000`                  | Uvicorn bind port                   |
| `LOG_LEVEL`            | `info`                  | Uvicorn log level                   |
| `CORS_ORIGINS`         | `http://localhost:3000` | Comma-separated allowed origins     |
| `CONFIDENCE_THRESHOLD` | `0.55`                  | Min confidence to emit a sign       |
| `SMOOTH_FRAMES`        | `5`                     | Frames required before emitting     |
| `SPEAK_COOLDOWN`       | `2.0`                   | Seconds between TTS repeats         |
| `MAX_FRAME_BYTES`      | `204800`                | Max WebSocket payload size (200 KB) |

### Frontend (`hearconnet-app/.env`)

| Variable               | Default                        | Description                       |
| ---------------------- | ------------------------------ | --------------------------------- |
| `REACT_APP_WS_URL`     | `ws://localhost:8000/ws/sign`  | WebSocket URL                     |
| `REACT_APP_HEALTH_URL` | `http://localhost:8000/health` | Health endpoint                   |
| `REACT_APP_FPS`        | `10`                           | Frames per second sent to backend |

---

## Running Backend Tests

```bash
cd backend
pytest -v
```

Expected: **15 tests** across 4 files (health, model, WS validation, WS buffer).

## Running Frontend Tests

```bash
cd hearconnet-app
npm test -- --watchAll=false
```

Expected: **5 test suites** (auth-guard, sign-page UI, sign-page history-dedupe, speech support, deaf-chat).

---

## Recognised Signs

| Label      | Emoji | ASL gesture                |
| ---------- | ----- | -------------------------- |
| HI         | 👋    | Open hand wave             |
| HELLO      | 🤗    | Two-hand wave              |
| I LOVE YOU | ❤️    | ILY hand shape             |
| YES        | ✅    | Fist nod                   |
| NO         | ❌    | Index + middle finger snap |
| PLEASE     | 🙏    | Open hand on chest         |

---

## Architecture Overview

```
Browser (React)
  │  base64 JPEG frames @ 10 fps
  ▼
FastAPI WebSocket  /ws/sign
  │  decode → OpenCV → MediaPipe
  │  63-dim feature vector (21 landmarks × xyz)
  │  GradientBoostingClassifier
  │  smoothing buffer (5 frames)
  ▼
JSON result  { sign, confidence, hand_detected }
  │
  ├─ Update UI overlay + history log
  └─ pyttsx3 TTS on server / Web Speech API in browser
```

---

## Troubleshooting

| Symptom                               | Fix                                                     |
| ------------------------------------- | ------------------------------------------------------- |
| `model_loaded: false` in health check | Run `python train.py --train` then restart server       |
| Camera permission denied              | Allow camera in browser → refresh                       |
| `CORS` error in console               | Add `http://localhost:3000` to `CORS_ORIGINS` in `.env` |
| Signs detected but TTS silent         | Check system audio; pyttsx3 uses OS voice engine        |
| Web Speech not working                | Use Chrome or Edge (Firefox not supported)              |
| `ModuleNotFoundError` on startup      | Activate venv and run `pip install -r requirements.txt` |
