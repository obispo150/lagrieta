/* =========================================================
   core.js — datos compartidos, utilidades, tema, idioma,
   favoritos, modal, enlaces directos y efectos generales
   ========================================================= */
"use strict";

const DD = "https://ddragon.leagueoflegends.com";

// Estado global que comparten todos los módulos
const APP = {
  ver: "", lang: "es_ES",
  champs: [], champMap: {},      // lista ordenada y mapa por id
  items: {}, itemList: [],       // todos los objetos y los de la tienda de la Grieta
  spells: [], runes: [],
  cache: {},                     // fichas completas de campeones ya descargadas
  favs: new Set(),
  listo: false
};

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// Los textos de Riot traen etiquetas propias (<mainText>, <stats>...): solo conservamos los saltos de línea
const limpia = s => esc(String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(li|p|passive|active|stats|mainText)[^>]*>/gi, "\n").replace(/<[^>]+>/g, ""))
  .replace(/^\s+|\s+$/g, "").replace(/\n\s*\n+/g, "\n").replace(/\n/g, "<br>");
const azar = arr => arr[Math.floor(Math.random() * arr.length)];
const mezcla = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (n, d = 0) => Number(n).toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });

const clases = { Assassin:"Asesino", Fighter:"Luchador", Mage:"Mago", Marksman:"Tirador", Support:"Apoyo", Tank:"Tanque" };
const recursos = { "Mana":"Maná","Energy":"Energía","Rage":"Furia","Fury":"Furia","Blood Well":"Pozo de sangre","Heat":"Calor","Ferocity":"Ferocidad",
  "Courage":"Valor","Shield":"Escudo","Flow":"Flujo","Grit":"Determinación","Bloodthirst":"Sed de sangre","None":"Sin recurso","":"Sin recurso" };
const nivel = d => d <= 3 ? 1 : d <= 6 ? 2 : 3;
const nivelTxt = ["", "Fácil", "Media", "Difícil"];

// Almacenamiento local seguro (puede fallar en modo privado)
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

// Rutas de imágenes
const img = {
  champ:   c => `${DD}/cdn/${APP.ver}/img/champion/${c.image.full}`,
  item:    id => `${DD}/cdn/${APP.ver}/img/item/${id}.png`,
  spell:   f => `${DD}/cdn/${APP.ver}/img/spell/${f}`,
  passive: f => `${DD}/cdn/${APP.ver}/img/passive/${f}`,
  icon:    id => `${DD}/cdn/${APP.ver}/img/profileicon/${id}.png`,
  splash:  (id, n = 0) => `${DD}/cdn/img/champion/splash/${id}_${n}.jpg`,
  loading: (id, n = 0) => `${DD}/cdn/img/champion/loading/${id}_${n}.jpg`,
  rune:    icon => `${DD}/cdn/img/${icon}`
};

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Ficha completa de un campeón (habilidades, historia, aspectos). Se guarda en caché.
async function champFull(id) {
  const k = APP.lang + ":" + id;
  if (!APP.cache[k]) APP.cache[k] = (await getJSON(`${DD}/cdn/${APP.ver}/data/${APP.lang}/champion/${id}.json`)).data[id];
  return APP.cache[k];
}

// Busca un campeón por nombre o id sin importar mayúsculas, tildes o espacios
function buscaCampeon(txt) {
  const n = norm(txt);
  return APP.champs.find(c => norm(c.name) === n || norm(c.id) === n);
}

/* ---------- estadísticas por nivel ---------- */
// Fórmula oficial de crecimiento: base + crecimiento * (n-1) * (0.7025 + 0.0175 * (n-1))
const crec = n => (n - 1) * (0.7025 + 0.0175 * (n - 1));
function statsNivel(c, n) {
  const s = c.stats, k = crec(n);
  return {
    hp: s.hp + s.hpperlevel * k,
    mp: s.mp + s.mpperlevel * k,
    ad: s.attackdamage + s.attackdamageperlevel * k,
    as: s.attackspeed * (1 + s.attackspeedperlevel * k / 100),
    asBonusPct: s.attackspeedperlevel * k,       // % de velocidad de ataque adicional por nivel
    armor: s.armor + s.armorperlevel * k,
    mr: s.spellblock + s.spellblockperlevel * k,
    ms: s.movespeed,
    range: s.attackrange,
    hpregen: s.hpregen + s.hpregenperlevel * k
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
    APP.itemList = Object.entries(i.data)
      .map(([id, it]) => ({ id, ...it }))
      .filter(it => +it.id < 10000 && it.maps?.["11"] && it.gold?.purchasable && it.inStore !== false
                 && !it.requiredChampion && !it.requiredAlly && !it.hideFromAll && it.name)
      .filter(it => { const k = norm(it.name); if (vistos.has(k)) return false; vistos.add(k); return true; });

    APP.spells = Object.values(s.data).filter(x => x.modes?.includes("CLASSIC")).sort((a, b) => a.summonerLevel - b.summonerLevel);
    APP.runes = r;
    APP.listo = true;

    actualizaContador($("statChamps"), APP.champs.length);
    actualizaContador($("statItems"), APP.itemList.length);
    $("patchInfo").textContent = `Parche ${APP.ver} · Idioma de los datos: ${APP.lang}`;
    document.dispatchEvent(new Event("datos"));
    router();
  } catch (e) {
    console.error(e);
    document.dispatchEvent(new CustomEvent("errorDatos", { detail: e }));
  }
}

// Pinta esqueletos mientras carga y un error con botón de reintentar si falla
function cargando(el, n = 24) { el.innerHTML = Array(n).fill('<div class="skel"></div>').join(""); }
function errorEn(el) {
  el.innerHTML = `<div class="err">No se han podido cargar los datos del juego. Esta sección necesita conexión a internet.
    <br><button class="btn sm" onclick="cargarDatos()">Reintentar</button></div>`;
}

/* ---------- modal compartido ---------- */
const modal = $("modal"), mbox = $("mbox");
let alCerrar = null, teclaModal = null;
function abrirModal(html, { estrecho = false, onClose = null, onKey = null } = {}) {
  mbox.className = "mbox" + (estrecho ? " narrow" : "");
  mbox.innerHTML = `<button class="mclose" aria-label="Cerrar">✕</button>` + html;
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
  if (/^#(campeon|objeto)\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
}
modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });
document.addEventListener("keydown", e => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") cerrarModal();
  else if (teclaModal) teclaModal(e);
});

/* ---------- aviso flotante ---------- */
let toastT;
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- enlaces directos: #campeon/Ahri, #objeto/3031 ---------- */
const rutas = {};   // cada módulo registra aquí su manejador
function ponerHash(h) { history.replaceState(null, "", "#" + h); }
function router() {
  if (!APP.listo) return;
  const m = location.hash.match(/^#(campeon|objeto)\/(.+)$/);
  if (m && rutas[m[1]]) rutas[m[1]](decodeURIComponent(m[2]));
}
addEventListener("hashchange", router);
async function copiarEnlace(h) {
  const url = location.href.split("#")[0] + "#" + h;
  try { await navigator.clipboard.writeText(url); toast("Enlace copiado"); }
  catch (e) { prompt("Copia este enlace:", url); }
}

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
function pintaTema() { themeBtn.textContent = document.documentElement.dataset.theme === "light" ? "🌙" : "☀️"; }
themeBtn.onclick = () => {
  const t = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = t; store.set("tema", t); pintaTema();
};
pintaTema();

/* ---------- idioma de los datos ---------- */
const langSel = $("langSel");
APP.lang = store.get("lang", "es_ES");
langSel.value = APP.lang;
langSel.onchange = () => { APP.lang = langSel.value; store.set("lang", APP.lang); cargarDatos(); toast("Cargando datos en " + langSel.selectedOptions[0].text); };

/* ---------- menú, scroll, contadores ---------- */
$("burger").onclick = () => $("menu").classList.toggle("open");
document.querySelectorAll("#menu a").forEach(a => a.addEventListener("click", () => $("menu").classList.remove("open")));

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

function actualizaContador(el, valor) { el.dataset.count = valor; if (!el._anim) el.textContent = valor; }
document.querySelectorAll("[data-count]").forEach(el => {
  const ini = +el.dataset.count > 1000 ? 1990 : 0, dur = 1400, t0 = performance.now();
  el._anim = true;
  (function paso(t) {
    const fin = +el.dataset.count, p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(ini + (fin - ini) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(paso); else el._anim = false;
  })(t0);
});

const topBtn = $("top");
addEventListener("scroll", () => topBtn.classList.toggle("show", scrollY > 600), { passive: true });
topBtn.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

// Arranca la carga cuando todos los scripts se han leído
addEventListener("DOMContentLoaded", cargarDatos);
