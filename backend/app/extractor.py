"""
app/extractor.py — MediaPipe feature extraction (wrist-relative, 63-dim).
"""
import numpy as np
import mediapipe as mp


class Extractor:
    """Wraps MediaPipe Hands and extracts normalised landmark vectors."""

    def __init__(
        self,
        *,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence:  float = 0.6,
    ) -> None:
        self._mp_hands = mp.solutions.hands
        self._hands = self._mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._draw_utils  = mp.solutions.drawing_utils
        self._draw_styles = mp.solutions.drawing_styles

    # ------------------------------------------------------------------
    def get_features(self, rgb_frame: np.ndarray) -> tuple[np.ndarray | None, bool]:
        """
        Process an RGB frame and return (feature_vector, hand_detected).

        feature_vector is a 63-dim float32 array of 21 landmarks × 3 axes,
        each coordinate relative to the wrist landmark.  Returns (None, False)
        when no hand is visible.
        """
        results = self._hands.process(rgb_frame)
        if not results.multi_hand_landmarks:
            return None, False

        lm = results.multi_hand_landmarks[0].landmark
        wrist = lm[0]
        coords: list[float] = []
        for pt in lm:
            coords += [pt.x - wrist.x, pt.y - wrist.y, pt.z - wrist.z]

        return np.array(coords, dtype=np.float32), True

    def draw(self, bgr_frame: np.ndarray, rgb_frame: np.ndarray) -> None:
        """Draw hand landmarks onto *bgr_frame* in-place (OpenCV display use)."""
        results = self._hands.process(rgb_frame)
        if results.multi_hand_landmarks:
            for hl in results.multi_hand_landmarks:
                self._draw_utils.draw_landmarks(
                    bgr_frame,
                    hl,
                    self._mp_hands.HAND_CONNECTIONS,
                    self._draw_styles.get_default_hand_landmarks_style(),
                    self._draw_styles.get_default_hand_connections_style(),
                )

    def close(self) -> None:
        """Release MediaPipe resources."""
        self._hands.close()
