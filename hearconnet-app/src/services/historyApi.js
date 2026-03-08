/**
 * services/historyApi.js — Sign detection history backed by MongoDB.
 */
import { API_URL } from "./apiConfig";

function authHeaders() {
  const token = localStorage.getItem("hc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Fetch the user's detection history. Returns an array of DetectionOut. */
export async function getHistory(limit = 50) {
  const res = await fetch(`${API_URL}/history?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch detection history.");
  return res.json();
}

/**
 * Save a single sign detection event.
 * Silently skips if the user is not logged in.
 */
export async function saveDetection({ sign, confidence }) {
  if (!localStorage.getItem("hc_token")) return;
  const res = await fetch(`${API_URL}/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ sign, confidence }),
  });
  if (!res.ok) throw new Error("Failed to save detection.");
  return res.json();
}

/** Delete all detection history for the current user. */
export async function clearHistory() {
  const res = await fetch(`${API_URL}/history`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to clear history.");
}
