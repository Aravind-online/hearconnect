/**
 * App.js — thin router shell for HearConnect
 * All page logic lives in src/pages/*.jsx
 */
import { useState, useCallback } from "react";
import GlobalStyle from "./components/GlobalStyle";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DeafChatPage from "./pages/DeafChatPage";
import SignLanguagePage from "./pages/SignLanguagePage";
import SpeechToTextPage from "./pages/SpeechToTextPage";
import { useAuthState } from "./hooks/useAuthState";
import { T } from "./styles/tokens";

/* Pages that require the user to be logged in */
const PROTECTED = new Set(["dashboard", "deaf-chat", "sign", "speech"]);

export default function App() {
  // Restore last page on refresh — land on dashboard if already logged in
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem("hc_page");
    if (saved && saved !== "login") return saved;
    return "home";
  });
  const { loggedIn, login, logout } = useAuthState();

  const go = useCallback(
    (dest) => {
      if (PROTECTED.has(dest) && !loggedIn) {
        setPage("login");
      } else {
        setPage(dest);
        sessionStorage.setItem("hc_page", dest);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [loggedIn],
  );

  const handleLogin = () => {
    login();
    go("dashboard");
  };
  const handleLogout = () => {
    logout();
    sessionStorage.removeItem("hc_page");
    setPage("home");
  };

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage go={go} />;
      case "login":
        return <LoginPage go={go} onLogin={handleLogin} />;
      case "dashboard":
        return <DashboardPage go={go} />;
      case "deaf-chat":
        return <DeafChatPage />;
      case "sign":
        return <SignLanguagePage />;
      case "speech":
        return <SpeechToTextPage />;
      default:
        return <HomePage go={go} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <Navbar page={page} go={go} loggedIn={loggedIn} onLogout={handleLogout} />
      <main>{renderPage()}</main>
      <footer
        style={{
          textAlign: "center",
          padding: "22px 16px",
          borderTop: `1px solid ${T.border}`,
          fontSize: 12,
          color: T.muted,
          background: T.surface,
        }}
      >
        HearConnect — bridging deaf, hearing-impaired &amp; hearing communities
        with AI
      </footer>
    </>
  );
}
