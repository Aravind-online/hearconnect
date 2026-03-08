/**
 * pages/SignLanguagePage.jsx
 * Connects to server.py via WebSocket.  All state/logic lives in useSignDetection.
 */
import Ico from "../components/Ico";
import ErrorBanner from "../components/ErrorBanner";
import StatusBadge from "../components/StatusBadge";
import SignReferenceGrid from "../components/SignReferenceGrid";
import DetectionHistory from "../components/DetectionHistory";
import { useSignDetection } from "../hooks/useSignDetection";
import { T, I } from "../styles/tokens";
import { getSignMeta, SIGNS } from "../constants/signs";

export default function SignLanguagePage() {
  const {
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
  } = useSignDetection();

  const confPct = result ? Math.round((result.confidence || 0) * 100) : 0;
  const detected = result?.sign ? getSignMeta(result.sign) : null;

  return (
    <div className="page" style={{ paddingTop: 60, padding: "72px 20px 56px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header row */}
        <div
          style={{
            marginBottom: 22,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: T.disp,
                fontSize: "clamp(20px,4vw,32px)",
                fontWeight: 800,
              }}
            >
              Sign Language → Text & Speech
            </h1>
            <p style={{ color: T.muted, marginTop: 4, fontSize: 13 }}>
              Powered by your trained model — recognises:{" "}
              {SIGNS.map((s, i) => (
                <span key={s.word} style={{ color: s.color, fontWeight: 600 }}>
                  {s.word}
                  {i < SIGNS.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
          <StatusBadge status={wsStatus} />
        </div>

        {/* Banners — only one shown at a time */}
        <ErrorBanner message={error} />
        {serverInfo && !error && (
          <ErrorBanner
            type="success"
            message={`Server ready · Model loaded: ${serverInfo.model_loaded} · TTS: ${serverInfo.speech} · Signs: ${serverInfo.signs?.join(", ")}`}
          />
        )}
        {/* Warn if model not loaded */}
        {serverInfo && !serverInfo.model_loaded && !error && (
          <ErrorBanner message="Model not loaded — run: python train.py --train  then restart the server." />
        )}

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* LEFT — Webcam panel */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: T.r,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <Ico d={I.cam} size={16} color={T.accent} />
              Webcam Input
              {running && (
                <span
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: T.green,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: T.green,
                      display: "inline-block",
                      animation: "blink 1s ease infinite",
                    }}
                  />
                  LIVE
                </span>
              )}
            </div>

            {/* Video viewport */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4/3",
                background: "#050c18",
                borderRadius: T.rs,
                overflow: "hidden",
                position: "relative",
                border: `2px solid ${running ? T.accent : T.border}`,
                transition: "border-color .3s",
              }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: running ? "block" : "none",
                  transform: "scaleX(-1)",
                }}
              />

              {!running && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Ico d={I.cam} size={44} color={`${T.muted}60`} />
                  <span style={{ fontSize: 13, color: T.muted }}>
                    Camera will appear here
                  </span>
                  <span style={{ fontSize: 11, color: `${T.muted}88` }}>
                    Press Start Live Detection below
                  </span>
                </div>
              )}

              {/* Scan line */}
              {running && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 2,
                    pointerEvents: "none",
                    background: `linear-gradient(90deg,transparent,${T.accent},transparent)`,
                    animation: "scan 2.2s linear infinite",
                  }}
                />
              )}

              {/* Hand detected badge */}
              {running && result && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: result.hand_detected
                      ? `${T.green}dd`
                      : `${T.danger}dd`,
                    borderRadius: 6,
                    padding: "3px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.bg,
                  }}
                >
                  {result.hand_detected ? "✋ Hand detected" : "No hand"}
                </div>
              )}

              {/* Confidence bar */}
              {running && confPct > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    background: T.border,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: confPct >= 75 ? T.g1 : T.warn,
                      width: `${confPct}%`,
                      transition: "width .2s ease",
                    }}
                  />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Start / Stop */}
            <div style={{ display: "flex", gap: 9 }}>
              {!running ? (
                <button
                  className="btn btn-p"
                  onClick={startSession}
                  disabled={serverInfo && !serverInfo.model_loaded}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <Ico d={I.play} size={14} color={T.bg} />
                  Start Live Detection
                </button>
              ) : (
                <button
                  className="btn btn-r"
                  onClick={stopSession}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <Ico d={I.stop} size={14} color="#fff" />
                  Stop
                </button>
              )}
            </div>

            <SignReferenceGrid detectedWord={detected?.word} />
          </div>

          {/* RIGHT — Output panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Detected sign card */}
            <div
              style={{
                background: T.card,
                border: `2px solid ${detected ? detected.color + "66" : T.border}`,
                borderRadius: T.r,
                padding: 24,
                transition: "border-color .3s",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  marginBottom: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".7px",
                }}
              >
                Detected Sign
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 50,
                    minWidth: 68,
                    minHeight: 68,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: detected ? `${detected.color}18` : T.bg,
                    borderRadius: 14,
                    border: `1px solid ${detected ? detected.color + "44" : T.border}`,
                    animation: detected ? "pop .4s ease" : "none",
                    transition: "background .2s, border-color .2s",
                  }}
                >
                  {detected?.emoji || "✋"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 800,
                      fontFamily: T.disp,
                      lineHeight: 1,
                      color: detected ? detected.color : `${T.muted}44`,
                      animation: detected ? "pop .35s ease" : "none",
                      transition: "color .2s",
                    }}
                  >
                    {detected?.word || (running ? "—" : "Idle")}
                  </div>
                  {detected && (
                    <div
                      style={{
                        fontSize: 12,
                        color: T.muted,
                        marginTop: 4,
                        fontStyle: "italic",
                      }}
                    >
                      {detected.desc}
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence bar */}
              {running && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: T.muted,
                      marginBottom: 5,
                    }}
                  >
                    <span>Confidence</span>
                    <span
                      style={{
                        color: confPct >= 75 ? T.green : T.warn,
                        fontWeight: 700,
                      }}
                    >
                      {confPct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: T.bg,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        background: confPct >= 75 ? T.g1 : T.warn,
                        width: `${confPct}%`,
                        transition: "width .22s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              {detected && (
                <button
                  className="btn btn-o"
                  onClick={() => speak(detected.word)}
                  disabled={speaking}
                  style={{ animation: "fadeUp .3s ease" }}
                >
                  <Ico d={I.vol} size={15} color={T.accent} />
                  {speaking ? "Speaking…" : "Speak Aloud (Browser)"}
                </button>
              )}

              {!detected && !running && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: T.muted,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  <Ico d={I.hand} size={16} color={T.muted} />
                  Press "Start Live Detection" to begin
                </div>
              )}
            </div>

            <DetectionHistory
              history={history}
              onClear={clearHistory}
              running={running}
            />

            {/* Info strip */}
            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: T.rs,
                padding: "11px 15px",
                fontSize: 12,
                color: T.muted,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <Ico
                d={I.info}
                size={14}
                color={T.muted}
                sx={{ flexShrink: 0, marginTop: 1 }}
              />
              <span>
                React streams webcam frames →{" "}
                <code style={{ color: T.accent }}>app/main.py</code> (WebSocket)
                → MediaPipe landmarks → GBM model → result back to UI. If model
                not loaded run{" "}
                <code style={{ color: T.green }}>python train.py --train</code>{" "}
                first.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
