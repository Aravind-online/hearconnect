/**
 * components/Navbar.jsx
 */
import Ico from "./Ico";
import { T, I } from "../styles/tokens";

const links = [
  { id: "home", label: "Home", icon: I.home },
  { id: "dashboard", label: "Dashboard", icon: I.dash },
  { id: "deaf-chat", label: "Deaf Chat", icon: I.chat },
  { id: "sign", label: "Sign Language", icon: I.hand },
  { id: "speech", label: "Speech→Text", icon: I.mic },
];

export default function Navbar({ page, go, loggedIn, onLogout }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: `${T.surface}f2`,
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          cursor: "pointer",
        }}
        onClick={() => go("home")}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: T.g1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ico d={I.ear} size={15} color={T.bg} />
        </div>
        <span
          style={{
            fontFamily: T.disp,
            fontSize: 18,
            fontWeight: 800,
            color: T.white,
          }}
        >
          Hear<span style={{ color: T.accent }}>connet</span>
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {links.map((l) => {
          const active = page === l.id;
          return (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              style={{
                background: active ? `${T.accent}16` : "transparent",
                border: active
                  ? `1px solid ${T.accent}50`
                  : "1px solid transparent",
                color: active ? T.accent : T.muted,
                padding: "5px 12px",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: T.font,
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all .18s",
              }}
            >
              <Ico d={l.icon} size={13} color={active ? T.accent : T.muted} />
              {l.label}
            </button>
          );
        })}
        {loggedIn && (
          <button
            className="btn btn-o"
            onClick={onLogout}
            style={{ marginLeft: 8, padding: "5px 13px", fontSize: 12 }}
          >
            <Ico d={I.out} size={13} color={T.accent} /> Logout
          </button>
        )}
      </div>
    </nav>
  );
}
