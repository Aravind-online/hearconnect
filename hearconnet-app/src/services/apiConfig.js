/**
 * services/apiConfig.js
 * Central place for all backend URLs and protocol constants.
 * Reads from Vite env vars (VITE_*) with safe dev defaults.
 */

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const WS_URL =
  import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/sign";

export const HEALTH_URL =
  import.meta.env.VITE_HEALTH_URL ?? `${API_URL}/health`;

/** Frames per second sent to the backend WebSocket. */
export const FPS = Number(import.meta.env.VITE_FPS ?? 12);
