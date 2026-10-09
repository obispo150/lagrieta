/* =========================================================
   core.js — datos compartidos, utilidades, secciones (router),
   idioma, tema, favoritos, modal y selector de campeones
   ========================================================= */
"use strict";

const DD = "https://ddragon.leagueoflegends.com";

const APP = {
  ver: "", lang: IDIOMAS[LANG],
  champs: [], champMap: {},
  items: {}, itemList: [],
  spells: [], runes: [],
  cache: {}, favs: new Set(), listo: false
};

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const limpia = s => esc(String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(li|p|passive|active|stats|mainText)[^>]*>/gi, "\n").replace(/<[^>]+>/g, ""))
  .replace(/^\s+|\s+$/g, "").replace(/\n\s*\n+/g, "\n").replace(/\n/g, "<br>");
const azar = arr => arr[Math.floor(Math.random() * arr.length)];
const mezcla = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (n, d = 0) => Number(n).toLocaleString(LANG === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
const clase = tag => t("cls." + tag);
const recurso = p => t("res." + (p ?? ""));
const nivel = d => d <= 3 ? 1 : d <= 6 ? 2 : 3;
const nivelTxt = n => [, t("ch.easy"), t("ch.medium"), t("ch.hard")][n];

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

const img = {
  champ:   c => `${DD}/cdn/${APP.ver}/img/champion/${c.image.full}`,
  item:    id => `${DD}/cdn/${APP.ver}/img/item/${id}.png`,
  spell:   f => `${DD}/cdn/${APP.ver}/img/spell/${f}`,
  passive: f => `${DD}/cdn/${APP.ver}/img/passive/${f}`,
  icon:    id => `${DD}/cdn/${APP.ver}/img/profileicon/${id}.png`,
  splash:  (id, n = 0) => `${DD}/cdn/img/champion/splash/${id}_${n}.jpg`,
  loading: (id, n = 0) => `${DD}/cdn/img/champion/loading/${id}_${n}.jpg`,
  rune:    ic => `${DD}/cdn/img/${ic}`
};

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
async function champFull(id) {
  const k = APP.lang + ":" + id;
  if (!APP.cache[k]) APP.cache[k] = (await getJSON(`${DD}/cdn/${APP.ver}/data/${APP.lang}/champion/${id}.json`)).data[id];
  return APP.cache[k];
}
function buscaCampeon(txt) {
  const n = norm(txt);
  return APP.champs.find(c => norm(c.name) === n || norm(c.id) === n);
}

/* ---------- estadísticas por nivel ---------- */
const crec = n => (n - 1) * (0.7025 + 0.0175 * (n - 1));
function statsNivel(c, n) {
  const s = c.stats, k = crec(n);
  return {
    hp: s.hp + s.hpperlevel * k, mp: s.mp + s.mpperlevel * k,
    ad: s.attackdamage + s.attackdamageperlevel * k,
    as: s.attackspeed * (1 + s.attackspeedperlevel * k / 100), asBonusPct: s.attackspeedperlevel * k,
    armor: s.armor + s.armorperlevel * k, mr: s.spellblock + s.spellblockperlevel * k,
    ms: s.movespeed, range: s.attackrange, hpregen: s.hpregen + s.hpregenperlevel * k
  };
}

/* ---------- carga de datos ---------- */
async function cargarDatos() {
  APP.listo = false;
  document.dispatchEvent(new Event("cargando"));
  try {
    if (!APP.ver) APP.ver = (await getJSON(`${DD}/api/versions.json`))[0];
    const base = `${DD}/cdn/${APP.ver}/data/${APP.lang}`;
    const [c, i, s, r] = await Promise.all([
      getJSON(`${base}/champion.json`), getJSON(`${base}/item.json`),
      getJSON(`${base}/summoner.json`), getJSON(`${base}/runesReforged.json`)
    ]);
    APP.champMap = c.data;
    APP.champs = Object.values(c.data).sort((a, b) => a.name.localeCompare(b.name));
    APP.items = i.data;
    const vistos = new Set();
    APP.itemList = Object.entries(i.data).map(([id, it]) => ({ id, ...it }))
      .filter(it => +it.id < 10000 && it.maps?.["11"] && it.gold?.purchasable && it.inStore !== false && !it.requiredChampion && !it.requiredAlly && !it.hideFromAll && it.name)
      .filter(it => { const k = norm(it.name); if (vistos.has(k)) return false; vistos.add(k); return true; });
    APP.spells = Object.values(s.data).filter(x => x.modes?.includes("CLASSIC")).sort((a, b) => a.summonerLevel - b.summonerLevel);
    APP.runes = r;
    APP.listo = true;

    $("statChamps").textContent = APP.champs.length;
    $("statItems").textContent = APP.itemList.length;
    $("statPatch").textContent = APP.ver.split(".").slice(0, 2).join(".");
    $("patchInfo").textContent = t("ui.patch", { v: APP.ver });
    pintaHero();
    document.dispatchEvent(new Event("datos"));
    if (/^#(campeon|objeto)\//.test(location.hash)) router();
  } catch (e) {
    console.error(e);
    document.dispatchEvent(new CustomEvent("errorDatos", { detail: e }));
  }
}
function cargando(el, n = 24) { el.innerHTML = Array(n).fill('<div class="skel"></div>').join(""); }
function errorEn(el) {
  el.innerHTML = `<div class="err">${t("ui.error")}<br><button class="btn sm" type="button" onclick="cargarDatos()">${icon("refresh")}${t("ui.retry")}</button></div>`;
}

/* ---------- imagen de portada ---------- */
function pintaHero() {
  const favoritos = ["Ahri", "Jinx", "Yasuo", "Lux", "Thresh", "Ekko", "Kaisa", "Vi", "Ezreal", "Akali", "Viego", "Yone"];
  const ok = favoritos.filter(id => APP.champMap[id]);
  if (!ok.length) return;
  const id = azar(ok), el = $("heroArt"), im = new Image();
  im.onload = () => { el.style.backgroundImage = `url('${im.src}')`; el.classList.add("on"); };
  im.src = img.splash(id);
}

/* ---------- modal ---------- */
const modal = $("modal"), mbox = $("mbox");
let alCerrar = null, teclaModal = null;
function abrirModal(html, { estrecho = false, onClose = null, onKey = null } = {}) {
  mbox.className = "mbox" + (estrecho ? " narrow" : "");
  mbox.innerHTML = `<button class="mclose" type="button" aria-label="${t("ui.close")}">${icon("x")}</button>` + html;
  mbox.querySelector(".mclose").onclick = cerrarModal;
  alCerrar = onClose; teclaModal = onKey;
  if (!modal.classList.contains("open")) { modal.classList.add("open"); document.body.style.overflow = "hidden"; }
  modal.scrollTop = 0;
}
function cerrarModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  if (alCerrar) alCerrar();
  alCerrar = teclaModal = null;
  if (/^#(campeon|objeto)\//.test(location.hash)) history.replaceState(null, "", "#/" + (vistaActual === "inicio" ? "" : vistaActual));
}
modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });
document.addEventListener("keydown", e => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") cerrarModal(); else if (teclaModal) teclaModal(e);
});

/* ---------- selector de campeón reutilizable ---------- */
function elegirCampeon(titulo, alElegir) {
  abrirModal(`<div class="mhead"><h3>${esc(titulo)}</h3></div>
    <div class="picker-top"><label class="field">${icon("search")}<input id="pkQ" type="search" placeholder="${t("ui.search")}"></label></div>
    <div class="picker-grid" id="pkGrid"></div>`, { estrecho: true });
  const q = $("pkQ"), grid = $("pkGrid");
  const dibuja = () => {
    const f = norm(q.value);
    grid.innerHTML = APP.champs.filter(c => norm(c.name).includes(f)).map(c =>
      `<button class="pk" type="button" data-id="${c.id}"><img loading="lazy" src="${img.champ(c)}" alt=""><small>${esc(c.name)}</small></button>`).join("");
  };
  dibuja(); q.oninput = dibuja; setTimeout(() => q.focus(), 30);
  grid.onclick = e => { const b = e.target.closest("[data-id]"); if (b) { cerrarModal(); alElegir(b.dataset.id); } };
}

/* ---------- aviso ---------- */
let toastT;
function toast(msg) {
  const el = $("toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------- secciones (router por hash) ---------- */
const VISTAS = ["inicio", "aprende", "campeones", "objetos", "runas", "comparador", "build", "draft", "jugador", "adivina", "quiz"];
const TITULO_VISTA = { aprende: "nav.learn", campeones: "nav.champions", objetos: "nav.items", runas: "nav.runes", comparador: "nav.compare",
  build: "nav.build", draft: "nav.draft", jugador: "nav.player", adivina: "nav.guess", quiz: "nav.quiz" };
const ANCLAS_APRENDE = ["juego", "roles", "mapa", "objetivos", "esports", "glosario"];
const rutas = {};
let vistaActual = null;

function mostrarVista(v, { arriba = true } = {}) {
  const cambia = v !== vistaActual;
  vistaActual = v;
  document.querySelectorAll(".view").forEach(s => s.classList.toggle("on", s.dataset.view === v));
  document.querySelectorAll("[data-route]").forEach(a => a.classList.toggle("on", a.dataset.route === v));
  document.querySelectorAll(".menu .dd").forEach(d => d.classList.toggle("on", !!d.querySelector(`[data-route="${v}"]`)));
  ponTitulo();
  $("menu").classList.remove("open");
  if (cambia && arriba) scrollTo({ top: 0 });
  if (cambia) document.dispatchEvent(new CustomEvent("vista", { detail: v }));
}
function ponTitulo() {
  document.title = vistaActual && TITULO_VISTA[vistaActual] ? `${t(TITULO_VISTA[vistaActual])} — La Grieta` : t("meta.title");
}
function router() {
  const h = decodeURIComponent(location.hash.slice(1));
  let m;
  if ((m = h.match(/^(campeon|objeto)\/(.+)$/))) {
    if (!vistaActual) mostrarVista(m[1] === "campeon" ? "campeones" : "objetos");
    if (APP.listo && rutas[m[1]]) rutas[m[1]](m[2]);
    return;
  }
  if (h.startsWith("/")) { const v = h.slice(1); return mostrarVista(VISTAS.includes(v) ? v : "inicio"); }
  if (ANCLAS_APRENDE.includes(h)) {
    mostrarVista("aprende", { arriba: false });
    requestAnimationFrame(() => $(h)?.scrollIntoView({ behavior: "smooth" }));
    return;
  }
  if (VISTAS.includes(h)) return mostrarVista(h);
  if (!h && vistaActual) return;
  mostrarVista("inicio");
}
addEventListener("hashchange", router);
function ponerHash(h) { history.replaceState(null, "", "#" + h); }
async function copiarTexto(txt, okMsg) {
  try { await navigator.clipboard.writeText(txt); toast(okMsg); }
  catch (e) { prompt(t("ui.copyLink"), txt); }
}
function copiarEnlace(h) { copiarTexto(location.href.split("#")[0] + "#" + h, t("ui.linkCopied")); }

/* ---------- favoritos ---------- */
APP.favs = new Set(store.get("favs", []));
function toggleFav(id) {
  APP.favs.has(id) ? APP.favs.delete(id) : APP.favs.add(id);
  store.set("favs", [...APP.favs]);
  document.dispatchEvent(new CustomEvent("favs", { detail: id }));
  return APP.favs.has(id);
}

/* ---------- tema ---------- */
const themeBtn = $("themeBtn");
function pintaTema() { themeBtn.innerHTML = icon(document.documentElement.dataset.theme === "light" ? "moon" : "sun"); }
themeBtn.onclick = () => {
  const nuevo = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = nuevo; store.set("tema", nuevo); pintaTema();
};

/* ---------- idioma ---------- */
function pintaIdioma() {
  document.querySelectorAll("#langSeg button").forEach(b => b.classList.toggle("on", b.dataset.lang === LANG));
  document.querySelectorAll("[data-min]").forEach(el => el.textContent = t("g.min", { n: el.dataset.min }));
  aplicaTextos();
  ponTitulo();
}
$("langSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === LANG) return;
  LANG = b.dataset.lang; store.set("idioma", LANG);
  APP.lang = IDIOMAS[LANG];
  pintaIdioma();
  document.dispatchEvent(new Event("idioma"));
  cargarDatos();
});

/* ---------- menú y botón arriba ---------- */
$("burger").onclick = () => $("menu").classList.toggle("open");
$("menu").addEventListener("click", e => { if (e.target.closest("a")) $("menu").classList.remove("open"); });
const topBtn = $("top");
addEventListener("scroll", () => topBtn.classList.toggle("show", scrollY > 700), { passive: true });
topBtn.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

/* ---------- arranque ---------- */
pintaIconos();
pintaTema();
pintaIdioma();
addEventListener("DOMContentLoaded", () => { router(); cargarDatos(); });
