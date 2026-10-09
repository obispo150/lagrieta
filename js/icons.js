/* =========================================================
   icons.js — iconos SVG propios (trazo 24x24)
   Uso en JS:   icon("search")
   Uso en HTML: <i data-icon="search"></i>  (se sustituye al cargar)
   ========================================================= */
"use strict";

const ICONS = {
  home:     '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  book:     '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7"/>',
  users:    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  bag:      '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  rune:     '<path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 7v10M8 10l4-3 4 3"/>',
  tools:    '<path d="M14.5 5.5a4 4 0 0 0 5 5L12 18l-3 3-3-3 3-3 7.5-7.5"/><path d="M4 4l5 5"/><path d="M3 7l4-4"/>',
  scale:    '<path d="M12 3v18M6 21h12"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/>',
  hammer:   '<path d="M14 6 6 14l4 4 8-8"/><path d="M13 3l8 8-2 2-8-8z"/><path d="M8 16l-5 5"/>',
  draft:    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
  search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  gamepad:  '<path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".6" fill="currentColor"/><circle cx="18" cy="13.5" r=".6" fill="currentColor"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
  dice:     '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
  star:     '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  starFill: '<path fill="currentColor" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  link:     '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  x:        '<path d="M6 6l12 12M18 6 6 18"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevLeft: '<path d="m15 6-6 6 6 6"/>',
  chevRight:'<path d="m9 6 6 6-6 6"/>',
  sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:     '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  menu:     '<path d="M4 7h16M4 12h16M4 17h16"/>',
  heart:    '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  heartFill:'<path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  drop:     '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  target:   '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  map:      '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  tower:    '<path d="M8 21V9l-2-2V3h3v2h2V3h2v2h2V3h3v4l-2 2v12z"/><path d="M6 21h12"/>',
  eye:      '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  trophy:   '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8M9 17h6v4H9z"/>',
  coins:    '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3"/><path d="M3 11v4c0 1.7 2.7 3 6 3"/><ellipse cx="15" cy="13" rx="6" ry="3"/><path d="M9 13v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/>',
  swords:   '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5 14 2h3v3l-4.5 4.5"/><path d="M5 14l-2 2 4 4 2-2"/>',
  castle:   '<path d="M4 21V8h3V5h2v3h2V5h2v3h2V5h2v3h3v13z"/><path d="M10 21v-5a2 2 0 0 1 4 0v5"/>',
  check:    '<path d="m5 12 5 5 9-10"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".7" fill="currentColor"/>',
  layers:   '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  copy:     '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  refresh:  '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5"/>',
  lock:     '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  ban:      '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  bolt:     '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  flame:    '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-10-1.5 2-2 3.5-2 5-1-1-2-2.5-2-4.5C8 8 5 11 5 15c0 4.3 3 7 7 7z"/>',
  leaf:     '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15"/><path d="M5 19l8-8"/>',
  crosshair:'<circle cx="12" cy="12" r="8"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>',
  shield:   '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  plusShield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 9v6M9 12h6"/>',
  globe:    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  share:    '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  play:     '<path d="M7 4v16l13-8z"/>',
  arrowUp:  '<path d="M12 19V5M5 12l7-7 7 7"/>',
  brain:    '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
  wave:     '<path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  crab:     '<ellipse cx="12" cy="14" rx="6" ry="4"/><path d="M6 13 3 9M18 13l3-4M8 17l-2 3M16 17l2 3M3 9l-1-3 3 1M21 9l1-3-3 1"/>',
  rock:     '<path d="M4 18 7 9l5-4 6 3 2 10z"/><path d="M9 12l3 2 3-3"/>',
  wolf:     '<path d="M5 4l3 5h8l3-5 1 8-4 7H8l-4-7z"/><circle cx="9.5" cy="12" r=".7" fill="currentColor"/><circle cx="14.5" cy="12" r=".7" fill="currentColor"/>',
  bird:     '<path d="M3 13c3-1 5-4 6-8 2 3 3 5 3 7 2-2 5-3 9-3-2 4-5 8-11 8-3 0-5-1-7-4z"/>',
  frog:     '<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M4 14c0-3 3.5-5 8-5s8 2 8 5-3.5 6-8 6-8-3-8-6z"/><path d="M9 15c1.5 1 4.5 1 6 0"/>',
  brush:    '<path d="M4 20c4 0 6-2 8-6M12 20c0-4 2-8 7-10M8 20c0-5-2-8-5-9M16 20c1-3 3-5 5-6"/>',
  minion:   '<circle cx="12" cy="12" r="5"/>',
  crown:    '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>'
};

function icon(name, cls = "") {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function pintaIconos(raiz = document) {
  raiz.querySelectorAll("i[data-icon]").forEach(el => { el.outerHTML = icon(el.dataset.icon, el.className); });
}
