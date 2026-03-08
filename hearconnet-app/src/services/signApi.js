/**
 * services/signApi.js — Health check and helper utilities.
 */
import { HEALTH_URL } from "./apiConfig";

/**
 * Ping the backend health endpoint.
 * Returns the parsed JSON body on success, or throws on network failure.
 */
export async function fetchHealth() {
  const res = await fetch(HEALTH_URL);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
