/**
 * services/apiConfig.js
 * Central place for all backend URLs and protocol constants.
 * Reads from Create React App env vars (REACT_APP_*) with safe dev defaults.
 */

export const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

export const WS_URL =
  process.env.REACT_APP_WS_URL ?? "ws://localhost:8000/ws/sign";

export const HEALTH_URL =
  process.env.REACT_APP_HEALTH_URL ?? `${API_URL}/health`;

/** Frames per second sent to the backend WebSocket. */
export const FPS = Number(process.env.REACT_APP_FPS ?? 12);
