/* pagina.js — tema y menú para las páginas de texto (guías, privacidad...) */
"use strict";
(() => {
  const SVG = d => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const SOL = SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
  const LUNA = SVG('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>');
  const html = document.documentElement, btn = document.getElementById("themeBtn");
  const pinta = () => btn.innerHTML = html.dataset.theme === "light" ? LUNA : SOL;
  btn.onclick = () => {
    html.dataset.theme = html.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("tema", JSON.stringify(html.dataset.theme)); } catch (e) {}
    pinta();
  };
  pinta();
  document.getElementById("burger").onclick = () => document.getElementById("menu").classList.toggle("open");
})();
