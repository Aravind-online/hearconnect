/**
 * services/authApi.js — Register and login against the backend.
 */
import { API_URL } from "./apiConfig";

/**
 * Register a new user account.
 * Returns { access_token, token_type, user } on success, throws on failure.
 */
export async function registerUser({ username, email, password }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed.");
  }
  return res.json();
}

/**
 * Log in with email + password.
 * Returns { access_token, token_type, user } on success, throws on failure.
 */
export async function loginUser({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid email or password.");
  }
  return res.json();
}
