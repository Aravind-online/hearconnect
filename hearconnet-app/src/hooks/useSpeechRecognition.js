/**
 * hooks/useSpeechRecognition.js
 * Encapsulates Web Speech API — start/stop, transcript, interim text, errors.
 *
 * Usage:
 *   const { supported, listening, transcript, interim, error, toggle, clear } =
 *     useSpeechRecognition();
 */
import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechRecognition({ lang = "en-US" } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const recogRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      setSupported(false);
      return;
    }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;

    r.onresult = (e) => {
      let fin = "",
        inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript + " ";
        else inter += e.results[i][0].transcript;
      }
      if (fin) setTranscript((t) => t + fin);
      setInterim(inter);
    };

    r.onerror = (e) => {
      setError(`Mic error: ${e.error}`);
      setListening(false);
    };

    r.onend = () => {
      setListening(false);
      setInterim("");
    };

    recogRef.current = r;
  }, [lang]);

  const toggle = useCallback(() => {
    if (!recogRef.current) return;
    setError("");
    if (listening) {
      recogRef.current.stop();
      setListening(false);
    } else {
      recogRef.current.start();
      setListening(true);
    }
  }, [listening]);

  const clear = useCallback(() => {
    setTranscript("");
    setInterim("");
  }, []);

  return { supported, listening, transcript, interim, error, toggle, clear };
}
