/**
 * pages/DeafChatPage.jsx
 * Chat with MongoDB persistence — messages are saved and restored per user.
 */
import { useState, useRef, useEffect } from "react";
import Ico from "../components/Ico";
import { T, I } from "../styles/tokens";
import { getMessages, sendMessage } from "../services/chatApi";

const AUTO_REPLIES = [
  "Got it! 👍",
  "Interesting!",
  "Thanks for that!",
  "I agree!",
  "Tell me more!",
];

export default function DeafChatPage() {
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [typing, setTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const endRef = useRef(null);

  // Load persisted messages on mount
  useEffect(() => {
    getMessages()
      .then((data) => {
        if (data.length > 0) {
          setMsgs(
            data.map((m) => ({
              id: m.id,
              from: m.from_name,
              text: m.text,
              time: new Date(m.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              mine: m.mine,
            })),
          );
        }
      })
      .catch(() => {
        // Not logged in or network error — start with empty chat
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const trimmed = txt.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsg = {
      id: Date.now(),
      from: "You",
      text: trimmed,
      time: now,
      mine: true,
    };
    setMsgs((m) => [...m, userMsg]);
    setTxt("");

    // Persist to MongoDB (fire-and-forget if not logged in)
    sendMessage(trimmed).catch(() => {});

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        {
          id: Date.now() + 1,
          from: "Alex",
          text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mine: false,
        },
      ]);
    }, 1300);
  };

  return (
    <div
      className="page"
      style={{
        paddingTop: 60,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 11,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: `${T.accent}1e`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Ico d={I.user} size={18} color={T.accent} />
          <span
            style={{
              position: "absolute",
              bottom: 1,
              right: 1,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: T.green,
              border: `2px solid ${T.card}`,
            }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Alex M.</div>
          <div style={{ fontSize: 11, color: T.green }}>Online — Deaf Chat</div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 9,
          background: T.bg,
        }}
      >
        {msgs.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.mine ? "flex-end" : "flex-start",
              animation: "fadeUp .2s ease",
            }}
          >
            <div style={{ maxWidth: "68%" }}>
              {!m.mine && (
                <div
                  style={{
                    fontSize: 10,
                    color: T.muted,
                    marginBottom: 3,
                    marginLeft: 3,
                  }}
                >
                  {m.from}
                </div>
              )}
              <div
                style={{
                  padding: "9px 14px",
                  background: m.mine ? T.g1 : T.card,
                  color: m.mine ? T.bg : T.text,
                  borderRadius: m.mine
                    ? "16px 16px 3px 16px"
                    : "16px 16px 16px 3px",
                  fontSize: 14,
                  lineHeight: 1.55,
                  border: m.mine ? "none" : `1px solid ${T.border}`,
                }}
              >
                {m.text}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  marginTop: 3,
                  textAlign: m.mine ? "right" : "left",
                  paddingInline: 3,
                }}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "0 3px",
              alignItems: "center",
            }}
          >
            {[0.1, 0.24, 0.38].map((d) => (
              <span
                key={d}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: T.muted,
                  animation: `wave 1s ease ${d}s infinite`,
                  display: "inline-block",
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: T.muted, marginLeft: 4 }}>
              Alex is typing…
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          background: T.card,
          borderTop: `1px solid ${T.border}`,
          padding: "12px 18px",
          display: "flex",
          gap: 9,
        }}
      >
        <input
          className="inp"
          placeholder="Type a message…"
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1 }}
          aria-label="Chat message"
        />
        <button
          className="btn btn-p"
          onClick={send}
          disabled={!txt.trim()}
          style={{ padding: "10px 16px" }}
          aria-label="Send message"
        >
          <Ico d={I.send} size={15} color={T.bg} />
        </button>
      </div>
    </div>
  );
}
