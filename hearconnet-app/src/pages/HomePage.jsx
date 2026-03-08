/**
 * pages/HomePage.jsx
 */
import Ico from "../components/Ico";
import { T, I } from "../styles/tokens";
import { SIGNS } from "../constants/signs";

export default function HomePage({ go }) {
  return (
    <div className="page" style={{ paddingTop: 60 }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient blobs */}
        {[
          { left: "7%", top: "8%", size: 420, color: T.accent, dur: "7s" },
          {
            right: "5%",
            bottom: "10%",
            size: 300,
            color: T.green,
            dur: "10s",
            rev: true,
          },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...(b.left ? { left: b.left } : { right: b.right }),
              ...(b.top ? { top: b.top } : { bottom: b.bottom }),
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle,${b.color}14 0%,transparent 70%)`,
              borderRadius: "50%",
              pointerEvents: "none",
              animation: `float ${b.dur} ease-in-out infinite ${b.rev ? "reverse" : ""}`,
            }}
          />
        ))}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: `${T.accent}10`,
            border: `1px solid ${T.accent}38`,
            borderRadius: 999,
            padding: "5px 14px",
            marginBottom: 26,
            fontSize: 11,
            fontWeight: 700,
            color: T.accent,
            animation: "fadeUp .6s ease",
            letterSpacing: "1px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T.accent,
              display: "inline-block",
              animation: "blink 2s ease infinite",
            }}
          />
          AI-POWERED ACCESSIBILITY PLATFORM
        </div>

        <h1
          style={{
            fontFamily: T.disp,
            fontSize: "clamp(42px,8vw,90px)",
            fontWeight: 800,
            lineHeight: 1.04,
            animation: "fadeUp .7s ease .1s both",
            maxWidth: 840,
          }}
        >
          <span style={{ color: T.white }}>Bridging the </span>
          <span
            style={{
              background: T.g1,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              animation: "gradMove 4s ease infinite",
            }}
          >
            Silence
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(14px,2.3vw,17px)",
            color: T.muted,
            maxWidth: 510,
            marginTop: 18,
            animation: "fadeUp .7s ease .2s both",
            lineHeight: 1.8,
          }}
        >
          Real-time AI bridges deaf, hearing-impaired and hearing people through
          sign language, speech recognition and instant text.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 36,
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fadeUp .7s ease .3s both",
          }}
        >
          <button
            className="btn btn-p"
            style={{ fontSize: 15, padding: "12px 32px" }}
            onClick={() => go("dashboard")}
          >
            Get Started →
          </button>
          <button className="btn btn-o" onClick={() => go("login")}>
            Sign In
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: 64,
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fadeUp .7s ease .4s both",
          }}
        >
          {[
            ["3", "Comm. Modes"],
            ["Real-time", "AI Detection"],
            ["6", "Sign Classes"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: T.accent,
                  fontFamily: T.disp,
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  marginTop: 2,
                  letterSpacing: ".4px",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section
        style={{ padding: "20px 24px 90px", maxWidth: 1040, margin: "0 auto" }}
      >
        <h2
          style={{
            textAlign: "center",
            fontFamily: T.disp,
            fontSize: "clamp(22px,4vw,36px)",
            fontWeight: 800,
            marginBottom: 40,
          }}
        >
          Three Ways to Connect
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))",
            gap: 20,
          }}
        >
          {[
            {
              i: I.chat,
              t: "Deaf ↔ Deaf Chat",
              c: "#00d4ff",
              d: "Accessible text messaging — no audio required on either side.",
            },
            {
              i: I.hand,
              t: "Sign Language → Speech",
              c: "#00e5a0",
              d: "Webcam + trained GBM model detects HI, HELLO, I LOVE YOU, YES, NO, PLEASE.",
            },
            {
              i: I.mic,
              t: "Speech → Text",
              c: "#ff6b9d",
              d: "Web Speech API transcribes spoken words live for deaf readers.",
            },
          ].map((f, idx) => (
            <div
              key={f.t}
              className="hover"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: T.r,
                padding: 28,
                animation: `fadeUp .6s ease ${0.1 + idx * 0.12}s both`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 13,
                  background: `${f.c}1e`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ico d={f.i} size={22} color={f.c} />
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 7,
                  color: T.white,
                }}
              >
                {f.t}
              </h3>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
