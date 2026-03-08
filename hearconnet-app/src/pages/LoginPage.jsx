/**
 * pages/LoginPage.jsx
 * Real auth backed by MongoDB — supports login and registration.
 */
import { useState } from "react";
import Ico from "../components/Ico";
import { T, I } from "../styles/tokens";
import { loginUser, registerUser } from "../services/authApi";
import { setCookie } from "../services/cookies";

export default function LoginPage({ go, onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email || !pw) {
      setErr("Please fill in all fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr("Enter a valid email address.");
      return;
    }
    if (mode === "register" && !username.trim()) {
      setErr("Please enter a username.");
      return;
    }
    if (mode === "register" && pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setLoad(true);
    try {
      const fn = mode === "register" ? registerUser : loginUser;
      const data = await fn({ username: username.trim(), email, password: pw });
      // Persist in both cookie (survives refresh) and localStorage (API helpers)
      const JWT_DAYS = 1; // matches JWT_EXPIRE_MINUTES=1440 on the backend
      setCookie("hc_token", data.access_token, JWT_DAYS);
      setCookie("hc_user", JSON.stringify(data.user), JWT_DAYS);
      localStorage.setItem("hc_token", data.access_token);
      localStorage.setItem("hc_user", JSON.stringify(data.user));
      setLoad(false);
      setUsername("");
      setEmail("");
      setPw("");
      onLogin();
      go("dashboard");
    } catch (e) {
      setLoad(false);
      setErr(e.message || "Something went wrong.");
    }
  };

  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "90px 24px 60px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: T.r,
          padding: 36,
          boxShadow: T.shadow,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: T.g1,
              margin: "0 auto 13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ico d={I.ear} size={21} color={T.bg} />
          </div>
          <h2 style={{ fontFamily: T.disp, fontSize: 23, fontWeight: 800 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
            {mode === "login" ? "Sign in to Hearconnet" : "Join Hearconnet"}
          </p>
        </div>

        <div
          style={{
            background: `${T.accent}0c`,
            border: `1px solid ${T.accent}28`,
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 20,
            fontSize: 12,
            color: T.accent,
          }}
        >
          {mode === "login"
            ? "Sign in with your registered account."
            : "Fill in the form below to create your account."}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div>
              <span className="lbl">Username</span>
              <input
                className="inp"
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoComplete="username"
              />
            </div>
          )}
          <div>
            <span className="lbl">Email</span>
            <input
              className="inp"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="email"
            />
          </div>
          <div>
            <span className="lbl">Password</span>
            <div style={{ position: "relative" }}>
              <input
                className="inp"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                style={{ paddingRight: 42 }}
                autoComplete="current-password"
              />
              <button
                onClick={() => setShow((p) => !p)}
                aria-label={show ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.muted,
                  padding: 3,
                }}
              >
                <Ico d={I.eye} size={15} />
              </button>
            </div>
          </div>
          {err && <p style={{ color: "#ff7a7a", fontSize: 13 }}>{err}</p>}
          <button
            className="btn btn-p"
            onClick={submit}
            disabled={load}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {load
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign In →"
                : "Create Account →"}
          </button>
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13,
            color: T.muted,
          }}
        >
          {mode === "login" ? "No account? " : "Already have an account? "}
          <span
            style={{ color: T.accent, cursor: "pointer", fontWeight: 600 }}
            onClick={() => {
              setErr("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Register" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}
