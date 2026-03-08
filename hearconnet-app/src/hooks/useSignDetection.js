/**
 * hooks/useSignDetection.js
 * Owns the entire lifecycle of a sign-detection session:
 *   • Webcam access
 *   • WebSocket connect / disconnect / reconnect
 *   • Frame capture loop (canvas → base64 JPEG → WS)
 *   • Result state + history log
 *   • Browser TTS
 *
 * Usage:
 *   const {
 *     running, wsStatus, result, history, serverInfo, error,
 *     startSession, stopSession, speak, speaking, clearHistory,
 *     videoRef, canvasRef,
 *   } = useSignDetection();
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { HEALTH_URL, WS_URL, FPS } from "../services/apiConfig";
import { fetchHealth } from "../services/signApi";
import { getSignMeta } from "../constants/signs";
import { saveDetection } from "../services/historyApi";

const HISTORY_LIMIT = 12;
/** Minimum ms between identical sign entries in the history log */
const HISTORY_DEDUP_MS = 2000;

export function useSignDetection() {
  const [wsStatus, setWsStatus] = useState("idle"); // idle|connecting|connected|error
  const [serverInfo, setServerInfo] = useState(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const lastHistoryEntry = useRef({ word: "", ts: 0 });

  // ── Ping health on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchHealth()
      .then((d) => {
        setServerInfo(d);
        setError("");
      })
      .catch(() =>
        setError(
          "Cannot reach server. Make sure you ran:  python -m uvicorn app.main:app --port 8000",
        ),
      );
  }, []);

  // ── Capture one frame and send it ────────────────────────────────────────
  const sendFrame = useCallback((ws) => {
    if (!videoRef.current || !canvasRef.current) return;
    if (ws.readyState !== WebSocket.OPEN) return;

    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);

    const b64 = canvasRef.current.toDataURL("image/jpeg", 0.75).split(",")[1];
    ws.send(JSON.stringify({ frame: b64 }));
  }, []);

  // ── Stop everything cleanly ───────────────────────────────────────────────
  const stopSession = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;

    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent spurious state updates
      wsRef.current.close();
      wsRef.current = null;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    setRunning(false);
    setWsStatus("idle");
  }, []);

  // ── Start session ─────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    // Guard: don't start if model not loaded
    if (serverInfo && !serverInfo.model_loaded) {
      setError(
        "Model not loaded on server. Train it first:  python train.py --train",
      );
      return;
    }

    setError("");
    setResult(null);

    // 1. Check camera support
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera not supported in this browser or context (need HTTPS in production).",
      );
      return;
    }

    // 2. Request camera
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
    } catch (e) {
      const msg =
        e.name === "NotAllowedError"
          ? "Camera access denied. Click 'Allow' when the browser asks."
          : `Camera error: ${e.message}`;
      setError(msg);
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    // 3. Connect WebSocket
    setWsStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      setRunning(true);
      timerRef.current = setInterval(() => sendFrame(ws), 1000 / FPS);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.error) return; // don't update result on server errors
        setResult(data);

        if (data.sign) {
          const now = Date.now();
          const last = lastHistoryEntry.current;
          // Deduplicate: skip if same word within HISTORY_DEDUP_MS
          if (data.sign !== last.word || now - last.ts > HISTORY_DEDUP_MS) {
            lastHistoryEntry.current = { word: data.sign, ts: now };
            const meta = getSignMeta(data.sign);
            setHistory((h) =>
              [
                {
                  word: data.sign,
                  color: meta.color,
                  emoji: meta.emoji,
                  conf: Math.round(data.confidence * 100),
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
                ...h,
              ].slice(0, HISTORY_LIMIT),
            );
            // Persist to MongoDB (silently skipped if not logged in)
            saveDetection({
              sign: data.sign,
              confidence: data.confidence,
            }).catch(() => {});
          }
        }
      } catch {
        /* ignore malformed JSON */
      }
    };

    ws.onerror = () => {
      setWsStatus("error");
      setError(
        "WebSocket error — is the server still running? Check your terminal.",
      );
      stopSession();
    };

    ws.onclose = () => {
      // Only update status if we're not already in a "stopSession" flow
      setWsStatus((prev) => (prev !== "idle" ? "idle" : prev));
    };
  }, [serverInfo, sendFrame, stopSession]);

  // ── Browser TTS ───────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(true);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.0;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopSession(), [stopSession]);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    running,
    wsStatus,
    result,
    history,
    serverInfo,
    error,
    startSession,
    stopSession,
    speak,
    speaking,
    clearHistory,
    videoRef,
    canvasRef,
  };
}
