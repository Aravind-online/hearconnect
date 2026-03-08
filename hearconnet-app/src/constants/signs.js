/**
 * constants/signs.js
 * Single source of truth for sign metadata.
 * Must stay in sync with backend/app/config.py SIGNS list.
 */

export const SIGNS = [
  {
    word: "HI",
    color: "#00d4ff",
    emoji: "👋",
    desc: "Open hand, wave side to side",
  },
  {
    word: "HELLO",
    color: "#00e5a0",
    emoji: "🤚",
    desc: "Flat hand from forehead outward",
  },
  {
    word: "I LOVE YOU",
    color: "#ff6b9d",
    emoji: "🤟",
    desc: "Thumb, index & pinky extended",
  },
  {
    word: "YES",
    color: "#a3e635",
    emoji: "✊",
    desc: "Fist nodding up and down",
  },
  {
    word: "NO",
    color: "#ff6b6b",
    emoji: "✌️",
    desc: "Index & middle tap thumb",
  },
  {
    word: "PLEASE",
    color: "#ffb800",
    emoji: "🙏",
    desc: "Flat hand circles on chest",
  },
];

/** Lookup helper — returns metadata or a safe fallback. */
export function getSignMeta(word) {
  return (
    SIGNS.find((s) => s.word === word) ?? {
      word,
      color: "#00d4ff",
      emoji: "✋",
      desc: "",
    }
  );
}
