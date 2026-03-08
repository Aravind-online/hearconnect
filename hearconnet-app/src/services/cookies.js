/**
 * services/cookies.js — Lightweight cookie helpers.
 */

/** Write a cookie that expires in `days` days. */
export function setCookie(name, value, days = 1) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Strict`;
}

/** Read a cookie by name. Returns null if not found. */
export function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/** Delete a cookie immediately. */
export function removeCookie(name) {
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Strict`;
}
