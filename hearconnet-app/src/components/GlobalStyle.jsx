/**
 * components/GlobalStyle.jsx — Injects global CSS once into <head>.
 */
import { useEffect } from "react";
import { T } from "../styles/tokens";

export default function GlobalStyle() {
  useEffect(() => {
    const id = "hc-gs";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
      *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
      html { scroll-behavior:smooth; }
      body {
        background:${T.bg}; color:${T.text};
        font-family:${T.font}; min-height:100vh;
        -webkit-font-smoothing:antialiased;
      }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-track { background:${T.surface}; }
      ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px; }
      ::-webkit-scrollbar-thumb:hover { background:${T.accent}; }
      ::selection { background:${T.accent}30; color:${T.accent}; }
      @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 ${T.accent}50} 50%{box-shadow:0 0 0 18px ${T.accent}00} }
      @keyframes wave     { 0%,100%{transform:scaleY(0.35)} 50%{transform:scaleY(1.4)} }
      @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.1} }
      @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
      @keyframes gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes scan     { 0%{top:0%} 100%{top:100%} }
      @keyframes pop      { 0%{transform:scale(.4);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      @keyframes ripple   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.4);opacity:0} }
      @keyframes handWave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(18deg)} 75%{transform:rotate(-10deg)} }
      @keyframes spin     { to{transform:rotate(360deg)} }
      .page { animation:fadeIn .35s ease; }
      .hover { transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
      .hover:hover { transform:translateY(-5px); box-shadow:${T.shadow}; border-color:${T.accent}80 !important; }
      .btn {
        display:inline-flex; align-items:center; gap:7px;
        padding:11px 24px; border-radius:${T.rs};
        font-family:${T.font}; font-size:14px; font-weight:600;
        cursor:pointer; border:none;
        transition:all .18s ease; letter-spacing:.2px; white-space:nowrap;
      }
      .btn-p  { background:${T.g1}; color:${T.bg}; }
      .btn-p:hover { filter:brightness(1.12); transform:translateY(-1px); box-shadow:0 6px 22px ${T.accent}44; }
      .btn-o  { background:transparent; color:${T.accent}; border:1.5px solid ${T.accent}80; }
      .btn-o:hover { background:${T.accent}14; border-color:${T.accent}; }
      .btn-g  { background:${T.card}; color:${T.text}; border:1px solid ${T.border}; }
      .btn-g:hover { border-color:${T.accent}60; color:${T.accent}; }
      .btn-r  { background:${T.danger}; color:#fff; }
      .btn-r:hover { filter:brightness(1.1); }
      .btn:disabled { opacity:.38; cursor:not-allowed; transform:none !important; filter:none !important; }
      .inp {
        width:100%; padding:12px 15px;
        background:${T.bg}; border:1.5px solid ${T.border};
        border-radius:${T.rs}; color:${T.text};
        font-family:${T.font}; font-size:15px;
        transition:border-color .18s, box-shadow .18s; outline:none;
      }
      .inp:focus { border-color:${T.accent}; box-shadow:0 0 0 3px ${T.accent}20; }
      .inp::placeholder { color:${T.muted}; }
      .lbl {
        display:block; margin-bottom:6px;
        font-size:11px; font-weight:700;
        color:${T.muted}; letter-spacing:.7px; text-transform:uppercase;
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}
