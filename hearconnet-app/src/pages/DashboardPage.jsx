/**
 * pages/DashboardPage.jsx
 */
import Ico from "../components/Ico";
import { T, I } from "../styles/tokens";

const modules = [
  {
    id: "deaf-chat",
    t: "Deaf ↔ Deaf Chat",
    d: "Private text chat — no audio needed.",
    i: I.chat,
    c: "#00d4ff",
    b: "Text",
  },
  {
    id: "sign",
    t: "Sign Language → Text",
    d: "Live webcam to your trained ML model.",
    i: I.hand,
    c: "#00e5a0",
    b: "AI Model",
  },
  {
    id: "speech",
    t: "Speech → Text",
    d: "Mic transcription for deaf readers in real time.",
    i: I.mic,
    c: "#ff6b9d",
    b: "Live",
  },
];

export default function DashboardPage({ go }) {
  return (
    <div className="page" style={{ paddingTop: 60, padding: "76px 24px 60px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 2 }}>
            Welcome back 👋
          </p>
          <h1
            style={{
              fontFamily: T.disp,
              fontSize: "clamp(22px,4vw,38px)",
              fontWeight: 800,
            }}
          >
            Communication Hub
          </h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(275px,1fr))",
            gap: 20,
          }}
        >
          {modules.map((m, i) => (
            <div
              key={m.id}
              className="hover"
              onClick={() => go(m.id)}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: T.r,
                padding: 28,
                cursor: "pointer",
                animation: `fadeUp .45s ease ${i * 0.1}s both`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 13,
                    background: `${m.c}1e`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ico d={m.i} size={22} color={m.c} />
                </div>
                <span
                  style={{
                    background: `${m.c}1e`,
                    color: m.c,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 800,
                    height: "fit-content",
                  }}
                >
                  {m.b}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 7,
                  color: T.white,
                }}
              >
                {m.t}
              </h3>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.75 }}>
                {m.d}
              </p>
              <div
                style={{
                  marginTop: 16,
                  color: m.c,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Open module →
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: 13,
            marginTop: 32,
          }}
        >
          {[
            ["128", "Messages Sent", T.accent],
            ["34", "Signs Detected", T.green],
            ["57", "Transcriptions", T.pink],
          ].map(([v, l, c]) => (
            <div
              key={l}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: T.rs,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: c,
                  fontFamily: T.disp,
                }}
              >
                {v}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
