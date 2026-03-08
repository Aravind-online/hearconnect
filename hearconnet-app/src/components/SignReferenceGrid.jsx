/**
 * components/SignReferenceGrid.jsx — Grid of known signs with emoji + hint.
 */
import { T } from "../styles/tokens";
import { SIGNS } from "../constants/signs";

export default function SignReferenceGrid({ detectedWord }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: T.muted,
          fontWeight: 700,
          letterSpacing: ".6px",
          textTransform: "uppercase",
          marginBottom: 9,
        }}
      >
        Sign Reference
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {SIGNS.map((s) => (
          <div
            key={s.word}
            style={{
              background: T.bg,
              borderRadius: 7,
              padding: "7px 10px",
              border: `1px solid ${detectedWord === s.word ? s.color + "66" : T.border}`,
              transition: "border-color .2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
                  {s.word}
                </div>
                <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.3 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
