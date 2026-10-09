/* =========================================================
   mapa.js — mapa interactivo de la Grieta del Invocador (SVG)
   Esquema propio: carriles, río, jungla, torres, inhibidores,
   campamentos, objetivos, arbustos y súbditos animados.
   ========================================================= */
"use strict";

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const W = 500;
  const svgBox = $("mapSvg"), info = $("mapInfo"), layersEl = $("mapLayers");
  const espejo = ([x, y]) => [W - x, W - y];          // el mapa es simétrico respecto al centro

  // Carriles (de la base azul a la base roja)
  const CARRILES = {
    top: "M78 392 L62 150 Q58 62 150 60 L392 76",
    mid: "M104 396 L396 104",
    bot: "M108 422 L350 438 Q438 442 440 350 L424 108"
  };

  // Icono de cada elemento; el texto sale de i18n ("mi.<clave>": "Título|Descripción")
  const ICONO = {
    top: "shield", mid: "bolt", bot: "crosshair", river: "wave", jungle: "leaf", baseB: "castle", baseR: "castle",
    nexusB: "crown", nexusR: "crown", tower: "tower", towerN: "tower", inhib: "layers", baron: "eye", dragon: "flame",
    scuttle: "crab", blue: "drop", red: "flame", gromp: "frog", wolves: "wolf", raptors: "bird", krugs: "rock",
    brush: "brush", minionB: "minion", minionR: "minion", intro: "map"
  };

  // Campamentos de la mitad azul (la mitad roja es su reflejo)
  const CAMPS = [
    ["blue", 128, 238, 9], ["gromp", 88, 214, 6.5], ["wolves", 140, 296, 6.5],
    ["raptors", 238, 318, 6.5], ["red", 266, 384, 9], ["krugs", 300, 418, 6.5]
  ];
  const BRUSHES = [
    [42, 215, 9, 26, -4], [120, 108, 22, 8, -40], [190, 290, 20, 8, -45], [300, 455, 26, 8, 0],
    [205, 225, 10, 6, 45], [250, 405, 18, 7, 0], [175, 140, 15, 7, 45], [95, 340, 8, 18, 0]
  ];

  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  // Dibuja uno de los iconos propios dentro del mapa
  const glifo = (parent, name, x, y, size, color) => {
    const g = el("svg", { x: x - size / 2, y: y - size / 2, width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: color, "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round", "pointer-events": "none" }, parent);
    g.innerHTML = ICONS[name] || "";
    return g;
  };
  const zona = (e, key) => { e.classList.add("zone"); if (key === "jungle") e.classList.add("bg"); e.dataset.k = key; return e; };

  function construir() {
    const svg = el("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", "aria-label": "Mapa de la Grieta del Invocador" });
    svg.innerHTML = `
      <defs>
        <radialGradient id="gTerreno" cx="50%" cy="50%" r="75%">
          <stop offset="0" stop-color="#1d4a35"/><stop offset="1" stop-color="#0b2419"/>
        </radialGradient>
        <pattern id="pHojas" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
          <circle cx="5" cy="6" r="4" fill="#173f2c"/><circle cx="16" cy="15" r="5" fill="#123524"/><circle cx="17" cy="4" r="2.5" fill="#1e4d36"/>
        </pattern>
        <linearGradient id="gRio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1b5f7a"/><stop offset=".5" stop-color="#2a86a3"/><stop offset="1" stop-color="#1b5f7a"/>
        </linearGradient>
        <radialGradient id="gBaseB"><stop offset="0" stop-color="#2b6cb0" stop-opacity=".9"/><stop offset="1" stop-color="#12375e" stop-opacity=".95"/></radialGradient>
        <radialGradient id="gBaseR"><stop offset="0" stop-color="#b8323f" stop-opacity=".9"/><stop offset="1" stop-color="#5a141c" stop-opacity=".95"/></radialGradient>
        <radialGradient id="gFoso"><stop offset="0" stop-color="#3a2a4a"/><stop offset="1" stop-color="#1a1424"/></radialGradient>
        <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="fSombra" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity=".6"/></filter>
      </defs>`;

    // Fondo y jungla
    el("rect", { width: W, height: W, rx: 14, fill: "url(#gTerreno)" }, svg);
    zona(el("rect", { width: W, height: W, rx: 14, fill: "url(#pHojas)", opacity: .9 }, svg), "jungle");

    // Río (con corriente animada)
    const rio = el("g", {}, svg);
    zona(el("path", { d: "M40 40 Q150 120 250 250 T460 460", stroke: "url(#gRio)", "stroke-width": 46, fill: "none", "stroke-linecap": "round", opacity: .9 }, rio), "river");
    el("path", { d: "M40 40 Q150 120 250 250 T460 460", stroke: "#8fd3e8", "stroke-width": 2, fill: "none", "stroke-dasharray": "6 14", opacity: .45, class: "corriente", "pointer-events": "none" }, rio);
    el("path", { d: "M52 30 Q160 112 258 238 T470 448", stroke: "#8fd3e8", "stroke-width": 1.2, fill: "none", "stroke-dasharray": "3 18", opacity: .3, class: "corriente lenta", "pointer-events": "none" }, rio);

    // Fosos del Barón y del Dragón
    const fosos = [["baron", 150, 168, "#b06ad8"], ["dragon", 350, 332, "#ff7b4a"]];
    fosos.forEach(([k, x, y, c]) => {
      const g = zona(el("g", { class: "capa-obj" }, svg), k);
      el("circle", { cx: x, cy: y, r: 22, fill: "url(#gFoso)", stroke: c, "stroke-width": 2, opacity: .95 }, g);
      el("circle", { cx: x, cy: y, r: 22, fill: "none", stroke: c, "stroke-width": 2, class: "pulso" }, g);
      glifo(g, k === "baron" ? "eye" : "flame", x, y, 22, c);
    });
    // Cangrejos
    [[198, 212], [302, 288]].forEach(([x, y]) => {
      const g = zona(el("g", { class: "capa-camp" }, svg), "scuttle");
      el("circle", { cx: x, cy: y, r: 8, fill: "#2a7f8f", stroke: "#bff3ff", "stroke-width": 1.5, filter: "url(#fSombra)" }, g);
      glifo(g, "crab", x, y, 11, "#e6fbff");
    });

    // Carriles: borde, tierra y línea central
    const carriles = el("g", {}, svg);
    for (const [k, d] of Object.entries(CARRILES)) {
      const g = zona(el("g", {}, carriles), k);
      el("path", { d, stroke: "#3b2f1e", "stroke-width": 24, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", opacity: .8 }, g);
      el("path", { d, stroke: "#8a7148", "stroke-width": 18, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      el("path", { d, stroke: "#b39563", "stroke-width": 1.5, fill: "none", "stroke-dasharray": "2 9", opacity: .7 }, g);
      el("path", { d, id: "lane-" + k, fill: "none", stroke: "none" }, carriles);
    }

    // Arbustos
    const arb = el("g", { class: "capa-brush" }, svg);
    const ponArbusto = ([x, y, rx, ry, rot]) => {
      const g = zona(el("g", { transform: `rotate(${rot} ${x} ${y})` }, arb), "brush");
      el("ellipse", { cx: x, cy: y, rx, ry, fill: "#2f6b3a", stroke: "#4f9a57", "stroke-width": 1, opacity: .95 }, g);
      el("ellipse", { cx: x - rx * .3, cy: y - ry * .2, rx: rx * .45, ry: ry * .45, fill: "#3f8a4a", opacity: .8 }, g);
    };
    BRUSHES.forEach(b => { ponArbusto(b); const [mx, my] = espejo(b); ponArbusto([mx, my, b[2], b[3], b[4]]); });

    // Campamentos de la jungla
    const camps = el("g", { class: "capa-camp" }, svg);
    const ICON = { blue: "", red: "", gromp: "frog", wolves: "wolf", raptors: "bird", krugs: "rock" };
    const ponCamp = (k, x, y, r) => {
      const g = zona(el("g", { filter: "url(#fSombra)" }, camps), k);
      const color = k === "blue" ? "#3d8bfd" : k === "red" ? "#ff5a4a" : "#c8aa6e";
      el("circle", { cx: x, cy: y, r: r + 3, fill: color, opacity: .25 }, g);
      el("circle", { cx: x, cy: y, r, fill: "#14281e", stroke: color, "stroke-width": 2 }, g);
      if (ICON[k]) glifo(g, ICON[k], x, y, r * 1.4, color);
      else el("circle", { cx: x, cy: y, r: r * .45, fill: color, filter: "url(#fGlow)" }, g);
    };
    CAMPS.forEach(([k, x, y, r]) => { ponCamp(k, x, y, r); const [mx, my] = espejo([x, y]); ponCamp(k, mx, my, r); });

    // Bases
    const bases = el("g", {}, svg);
    zona(el("path", { d: "M0 500 L0 368 Q70 360 110 400 Q140 430 132 500 Z", fill: "url(#gBaseB)", stroke: "#5aa9ff", "stroke-width": 2, opacity: .95 }, bases), "baseB");
    zona(el("path", { d: "M500 0 L500 132 Q430 140 400 110 Q360 70 368 0 Z", fill: "url(#gBaseR)", stroke: "#ff6b78", "stroke-width": 2, opacity: .95 }, bases), "baseR");
    // Fuentes de reaparición
    el("circle", { cx: 20, cy: 480, r: 14, fill: "#5aa9ff", opacity: .4, filter: "url(#fGlow)", "pointer-events": "none" }, bases);
    el("circle", { cx: 480, cy: 20, r: 14, fill: "#ff6b78", opacity: .4, filter: "url(#fGlow)", "pointer-events": "none" }, bases);

    // Estructuras: torres, inhibidores y nexo, colocados sobre los carriles
    const estr = el("g", { class: "capa-tower" }, svg);
    const torre = (x, y, eq, k = "tower") => {
      const c = eq === "B" ? "#5aa9ff" : "#ff6b78";
      const g = zona(el("g", { filter: "url(#fSombra)" }, estr), k);
      el("circle", { cx: x, cy: y, r: 7.5, fill: "#1b1f2a", stroke: c, "stroke-width": 2 }, g);
      el("path", { d: `M${x} ${y - 4.5} L${x + 3.5} ${y + 3} L${x - 3.5} ${y + 3}Z`, fill: c }, g);
    };
    const inhib = (x, y, eq) => {
      const c = eq === "B" ? "#5aa9ff" : "#ff6b78";
      const g = zona(el("g", {}, estr), "inhib");
      el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, transform: `rotate(45 ${x} ${y})`, fill: c, stroke: "#fff", "stroke-width": 1, filter: "url(#fGlow)" }, g);
    };
    // Las torres se colocan midiendo los carriles, así que hay que esperar a que el mapa se vea
    svg._colocar = () => {
      if (svg._hecho) return; svg._hecho = true;
      for (const k of Object.keys(CARRILES)) {
        const p = svg.querySelector("#lane-" + k), L = p.getTotalLength();
        const at = t => { const q = p.getPointAtLength(L * t); return [q.x, q.y]; };
        [[.03, "inhib"], [.13, "tower"], [.27, "tower"], [.41, "tower"]].forEach(([t, tipo]) => {
          const b = at(t), r = at(1 - t);
          if (tipo === "inhib") { inhib(...b, "B"); inhib(...r, "R"); } else { torre(...b, "B"); torre(...r, "R"); }
        });
      }
    };
    torre(66, 420, "B", "towerN"); torre(82, 436, "B", "towerN");
    torre(434, 80, "R", "towerN"); torre(418, 64, "R", "towerN");
    const nexo = (x, y, eq) => {
      const c = eq === "B" ? "#7cc4ff" : "#ff8a95";
      const g = zona(el("g", {}, bases), eq === "B" ? "nexusB" : "nexusR");
      el("circle", { cx: x, cy: y, r: 18, fill: c, opacity: .25, class: "pulso-lento" }, g);
      el("path", { d: `M${x} ${y - 13} L${x + 11} ${y} L${x} ${y + 13} L${x - 11} ${y}Z`, fill: c, stroke: "#fff", "stroke-width": 1.5, filter: "url(#fGlow)" }, g);
    };
    nexo(52, 448, "B"); nexo(448, 52, "R");

    // Súbditos animados recorriendo cada carril
    const subs = el("g", { class: "capa-minion" }, svg);
    for (const k of Object.keys(CARRILES)) {
      for (const [eq, c] of [["B", "#7cc4ff"], ["R", "#ff8a95"]]) {
        for (let i = 0; i < 3; i++) {
          const g = zona(el("g", {}, subs), eq === "B" ? "minionB" : "minionR");
          el("circle", { r: 3.2, fill: c, stroke: "#0b1220", "stroke-width": 1 }, g);
          const a = el("animateMotion", { dur: "16s", repeatCount: "indefinite", begin: `${i * .45 + (k === "mid" ? .8 : 0)}s`,
            keyPoints: eq === "B" ? "0;0.5" : "1;0.5", keyTimes: "0;1", calcMode: "linear" }, g);
          el("mpath", { href: "#lane-" + k }, a);
        }
      }
    }

    svgBox.innerHTML = "";
    svgBox.appendChild(svg);
    return svg;
  }

  const svg = construir();

  const intentaColocar = () => { if (svgBox.offsetParent !== null) svg._colocar(); };
  document.addEventListener("vista", e => { if (e.detail === "aprende") requestAnimationFrame(intentaColocar); });
  requestAnimationFrame(intentaColocar);

  // Panel de información
  let fijado = null, ultimo = "intro";
  function mostrar(k) {
    if (!ICONO[k]) return;
    ultimo = k;
    const [titulo, desc] = t("mi." + k).split("|");
    info.innerHTML = `${icon(ICONO[k])}<div><h4>${titulo}</h4><p>${desc}</p></div>`;
  }
  svg.addEventListener("mouseover", e => { const z = e.target.closest(".zone"); if (z && !fijado) mostrar(z.dataset.k); });
  svg.addEventListener("click", e => {
    const z = e.target.closest(".zone"); if (!z) return;
    svg.querySelectorAll(".zone.sel").forEach(x => x.classList.remove("sel"));
    if (fijado === z) { fijado = null; return; }
    fijado = z; z.classList.add("sel"); mostrar(z.dataset.k);
  });

  // Capas activables
  const CAPAS = [["tower", "tower", "map.l.towers"], ["camp", "wolf", "map.l.camps"], ["obj", "flame", "map.l.obj"], ["brush", "brush", "map.l.brush"], ["minion", "minion", "map.l.minions"]];
  function pintaCapas() {
    layersEl.innerHTML = CAPAS.map(([k, ic, key]) =>
      `<button type="button" data-capa="${k}" class="${svg.classList.contains("sin-" + k) ? "" : "on"}">${icon(ic)}${t(key)}</button>`).join("");
  }
  layersEl.addEventListener("click", e => {
    const b = e.target.closest("[data-capa]"); if (!b) return;
    b.classList.toggle("on"); svg.classList.toggle("sin-" + b.dataset.capa, !b.classList.contains("on"));
  });
  pintaCapas(); mostrar("intro");
  document.addEventListener("idioma", () => { pintaCapas(); mostrar(ultimo); });
  svg.setAttribute("aria-label", t("map.h"));
})();
