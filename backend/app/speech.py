"""
app/speech.py — Threaded TTS worker so pyttsx3 never blocks the event loop.
"""
import queue
import threading

try:
    import pyttsx3
    _PYTTSX3_OK = True
except ImportError:
    _PYTTSX3_OK = False

# Exposed flag so callers can branch on availability
SPEECH_AVAILABLE: bool = _PYTTSX3_OK

_QUEUE_MAX = 1   # keep only the latest utterance — never build a backlog


class SpeechWorker:
    """Thread-safe TTS worker.  Call .say() from any thread."""

    def __init__(self) -> None:
        # Bounded queue: old items are discarded before a new one is added.
        self._q: queue.Queue[str | None] = queue.Queue(maxsize=_QUEUE_MAX)
        self._started = False

        if _PYTTSX3_OK:
            t = threading.Thread(target=self._run, daemon=True, name="tts-worker")
            t.start()
            self._started = True

    # ------------------------------------------------------------------
    def _run(self) -> None:
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.setProperty("volume", 1.0)
        for v in engine.getProperty("voices"):
            if any(k in v.name.lower() for k in ("english", "zira", "david")):
                engine.setProperty("voice", v.id)
                break

        while True:
            text = self._q.get()
            if text is None:          # sentinel — shut down gracefully
                break
            engine.say(text)
            engine.runAndWait()

    # ------------------------------------------------------------------
    def say(self, text: str) -> None:
        """Speak *text*, discarding any pending item to avoid backlog."""
        if not self._started:
            return
        # Drain the queue first (at most 1 item due to maxsize)
        try:
            self._q.get_nowait()
        except queue.Empty:
            pass
        try:
            self._q.put_nowait(text)
        except queue.Full:
            pass  # extremely unlikely after drain, safe to skip

    def stop(self) -> None:
        """Send shutdown sentinel to the worker thread."""
        if self._started:
            try:
                self._q.put(None, timeout=1)
            except queue.Full:
                pass
