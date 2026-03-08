/**
 * hooks/useAuthState.js
 * JWT-backed auth state — token persisted in a cookie (survives refresh).
 * localStorage is kept in sync as a secondary read target.
 */
import { useState, useCallback } from "react";
import { getCookie, removeCookie } from "../services/cookies";

const TOKEN_KEY = "hc_token";
const USER_KEY = "hc_user";

function readUser() {
  try {
    // Prefer cookie, fall back to localStorage
    const raw = getCookie(USER_KEY) || localStorage.getItem(USER_KEY);
    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
}

export function useAuthState() {
  // Initialise synchronously from cookie (survives hard refresh)
  const [loggedIn, setLoggedIn] = useState(
    () => !!(getCookie(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)),
  );
  const [user, setUser] = useState(readUser);

  /**
   * Call after LoginPage has written the cookie + localStorage.
   * Re-reads state so the rest of the tree updates immediately.
   */
  const login = useCallback(() => {
    setLoggedIn(!!(getCookie(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)));
    setUser(readUser());
  }, []);

  const logout = useCallback(() => {
    removeCookie(TOKEN_KEY);
    removeCookie(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setLoggedIn(false);
    setUser(null);
  }, []);

  return { loggedIn, user, login, logout };
}
