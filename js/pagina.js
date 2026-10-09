/* pagina.js — tema y menú para las páginas de texto (guías, privacidad...) */
"use strict";
(() => {
  const html = document.documentElement, btn = document.getElementById("themeBtn");
  const pinta = () => btn.textContent = html.dataset.theme === "light" ? "🌙" : "☀️";
  btn.onclick = () => {
    html.dataset.theme = html.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("tema", JSON.stringify(html.dataset.theme)); } catch (e) {}
    pinta();
  };
  pinta();
  document.getElementById("burger").onclick = () => document.getElementById("menu").classList.toggle("open");
})();
