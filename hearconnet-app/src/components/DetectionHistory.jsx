/**
 * components/DetectionHistory.jsx — Scrollable recent-detections log.
 */
import Ico from "./Ico";
import { T, I } from "../styles/tokens";

export default function DetectionHistory({ history, onClear, running }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.r,
        padding: 22,
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 13,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: T.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".7px",
          }}
        >
          Detection Log
        </div>
        {history.length > 0 && (
          <button
            className="btn btn-g"
            onClick={onClear}
            style={{ padding: "3px 10px", fontSize: 11 }}
          >
            <Ico d={I.trash} size={11} color={T.muted} /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p style={{ color: `${T.muted}77`, fontSize: 13, fontStyle: "italic" }}>
          {running ? "Waiting for a sign…" : "No detections yet."}
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {history.map((h, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 11px",
                background: T.bg,
                borderRadius: 8,
                fontSize: 13,
                borderLeft: `3px solid ${h.color || T.accent}`,
                animation: "fadeUp .2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 16 }}>{h.emoji}</span>
                <span style={{ fontWeight: 700, color: h.color || T.accent }}>
                  {h.word}
                </span>
              </div>
              <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <span
                  style={{
                    color: h.conf >= 75 ? T.green : T.warn,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {h.conf}%
                </span>
                <span style={{ color: T.muted, fontSize: 10 }}>{h.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
