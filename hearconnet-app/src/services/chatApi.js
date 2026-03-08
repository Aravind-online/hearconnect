/**
 * services/chatApi.js — Persistent chat messages backed by MongoDB.
 */
import { API_URL } from "./apiConfig";

function authHeaders() {
  const token = localStorage.getItem("hc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Fetch saved chat messages for the current user. */
export async function getMessages(limit = 50) {
  const res = await fetch(`${API_URL}/chat/messages?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch messages.");
  return res.json();
}

/** Persist one outgoing message. Returns the saved MessageOut. */
export async function sendMessage(text) {
  const res = await fetch(`${API_URL}/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to send message.");
  return res.json();
}

/** Delete all chat messages for the current user. */
export async function clearMessages() {
  const res = await fetch(`${API_URL}/chat/messages`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to clear messages.");
}
