/**
 * pages/SpeechToTextPage.jsx
 * Uses useSpeechRecognition hook — all Web Speech API logic encapsulated.
 */
import Ico from "../components/Ico";
import { T, I } from "../styles/tokens";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export default function SpeechToTextPage() {
  const { supported, listening, transcript, interim, error, toggle, clear } =
    useSpeechRecognition();

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="page" style={{ paddingTop: 60, padding: "72px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 30 }}>
          <h1
            style={{
              fontFamily: T.disp,
              fontSize: "clamp(20px,4vw,32px)",
              fontWeight: 800,
            }}
          >
            Speech → Text
          </h1>
          <p style={{ color: T.muted, marginTop: 4, fontSize: 13 }}>
            Hearing users speak — deaf users read the live transcription via Web
            Speech API.
          </p>
        </div>

        {!supported ? (
          <div
            style={{
              background: `${T.danger}18`,
              border: `1px solid ${T.danger}44`,
              borderRadius: T.r,
              padding: 24,
              color: "#ff8fa3",
              fontSize: 14,
            }}
          >
            Web Speech API not supported in this browser. Please use Chrome or
            Edge.
          </div>
        ) : (
          <>
            {/* Mic button */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 32,
                position: "relative",
              }}
            >
              {listening &&
                [1, 1.5, 2].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 96 * s,
                      height: 96 * s,
                      borderRadius: "50%",
                      border: `1.5px solid ${T.accent}`,
                      animation: `ripple ${1 + i * 0.3}s ease ${i * 0.25}s infinite`,
                      pointerEvents: "none",
                    }}
                  />
                ))}
              <button
                onClick={toggle}
                aria-label={listening ? "Stop listening" : "Start listening"}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: listening ? `${T.accent}18` : T.card,
                  outline: `3px solid ${listening ? T.accent : T.border}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  transition: "all .3s",
                  zIndex: 1,
                }}
              >
                <Ico
                  d={I.mic}
                  size={28}
                  color={listening ? T.accent : T.muted}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "1px",
                    color: listening ? T.accent : T.muted,
                  }}
                >
                  {listening ? "ON" : "TAP"}
                </span>
              </button>
            </div>

            {/* Status */}
            <div style={{ textAlign: "center", marginBottom: 22, height: 34 }}>
              {listening ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: T.accent,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: T.accent,
                      display: "inline-block",
                      animation: "blink 1s ease infinite",
                    }}
                  />
                  Listening… speak now
                </span>
              ) : (
                <span style={{ color: T.muted, fontSize: 13 }}>
                  Tap the mic to start
                </span>
              )}
              {error && (
                <span
                  style={{
                    color: "#ff7a7a",
                    fontSize: 12,
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {error}
                </span>
              )}
            </div>

            {/* Wave bars */}
            {listening && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  marginBottom: 26,
                  height: 34,
                  alignItems: "center",
                }}
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      borderRadius: 2,
                      background: T.g1,
                      height: `${12 + Math.random() * 20}px`,
                      animation: `wave ${0.35 + Math.random() * 0.55}s ease ${i * 0.035}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Transcript box */}
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: T.r,
                padding: 24,
                minHeight: 185,
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
                  Live Transcript
                </div>
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: T.muted }}>
                    {wordCount} word{wordCount !== 1 ? "s" : ""}
                  </span>
                  <button
                    className="btn btn-g"
                    onClick={clear}
                    style={{ padding: "4px 11px", fontSize: 11 }}
                  >
                    <Ico d={I.trash} size={11} color={T.muted} /> Clear
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.9,
                  fontFamily: T.mono,
                  minHeight: 100,
                }}
              >
                {transcript && (
                  <span style={{ color: T.text }}>{transcript}</span>
                )}
                {interim && (
                  <span style={{ color: `${T.accent}99` }}>{interim}</span>
                )}
                {!transcript && !interim && (
                  <span
                    style={{
                      color: `${T.muted}55`,
                      fontStyle: "italic",
                      fontSize: 14,
                    }}
                  >
                    Transcript will appear here…
                  </span>
                )}
                {listening && (
                  <span
                    style={{
                      borderLeft: `2px solid ${T.accent}`,
                      animation: "blink 1s ease infinite",
                      marginLeft: 2,
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
