/* =========================================================
   build.js — simulador de build (campeón + nivel + 6 objetos)
   ========================================================= */
"use strict";

(() => {
  const selC = $("bChamp"), lvl = $("bLvl"), slotsEl = $("bSlots"), statsEl = $("bStats"), effEl = $("bEffects");
  let build = store.get("build", { champ: "", items: [null, null, null, null, null, null] });

  // Estadísticas que Data Dragon da en número. Otras (celeridad, letalidad...) solo vienen en el texto del objeto.
  const MAPA = {
    FlatHPPoolMod: ["hp", 1], FlatMPPoolMod: ["mp", 1], FlatPhysicalDamageMod: ["ad", 1], FlatMagicDamageMod: ["ap", 1],
    FlatArmorMod: ["armor", 1], FlatSpellBlockMod: ["mr", 1], PercentAttackSpeedMod: ["asPct", 100],
    FlatMovementSpeedMod: ["msFlat", 1], PercentMovementSpeedMod: ["msPct", 100], FlatCritChanceMod: ["crit", 100],
    PercentLifeStealMod: ["ls", 100], FlatHPRegenMod: ["hpregen", 1]
  };

  const guarda = () => store.set("build", build);
  const elegibles = () => APP.itemList.filter(it => tipoObjeto(it) !== "basico" || it.tags?.includes("Boots"))
                                      .filter(it => !it.tags?.includes("Consumable") && !it.tags?.includes("Trinket"));

  function llena() {
    selC.innerHTML = APP.champs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    if (!APP.champMap[build.champ]) build.champ = APP.champMap.Jinx ? "Jinx" : APP.champs[0].id;
    build.items = build.items.map(id => id && APP.items[id] ? id : null);
    selC.value = build.champ;
    pinta();
  }

  function pinta() {
    if (!APP.listo) return;
    const c = APP.champMap[build.champ], n = +lvl.value;
    $("bLvlTxt").textContent = n;
    $("bPortrait").innerHTML = `<img src="${img.champ(c)}" alt=""><div><b>${esc(c.name)}</b><span class="muted">Nivel ${n}</span></div>`;

    slotsEl.innerHTML = build.items.map((id, i) => id
      ? `<button class="slot full" data-s="${i}" title="${esc(APP.items[id].name)}"><img src="${img.item(id)}" alt=""><span class="x" data-del="${i}">✕</span></button>`
      : `<button class="slot" data-s="${i}" aria-label="Añadir objeto">+</button>`).join("");

    const its = build.items.filter(Boolean).map(id => APP.items[id]);
    const total = its.reduce((s, it) => s + precio(it), 0);
    $("bCost").innerHTML = `Coste total: <span class="gold">${fmt(total)} de oro</span> · ${its.length}/6 objetos`;

    // Suma de estadísticas de objetos
    const b = { hp:0, mp:0, ad:0, ap:0, armor:0, mr:0, asPct:0, msFlat:0, msPct:0, crit:0, ls:0, hpregen:0 };
    its.forEach(it => Object.entries(it.stats || {}).forEach(([k, v]) => { if (MAPA[k]) b[MAPA[k][0]] += v * MAPA[k][1]; }));

    const s = statsNivel(c, n);
    const asTotal = c.stats.attackspeed * (1 + (s.asBonusPct + b.asPct) / 100);
    const msTotal = (s.ms + b.msFlat) * (1 + b.msPct / 100);
    const datos = [
      ["Vida", s.hp + b.hp, b.hp, 0], ["Maná / recurso", s.mp + b.mp, b.mp, 0],
      ["Daño de ataque", s.ad + b.ad, b.ad, 0], ["Poder de habilidad", b.ap, b.ap, 0],
      ["Armadura", s.armor + b.armor, b.armor, 0], ["Resist. mágica", s.mr + b.mr, b.mr, 0],
      ["Vel. de ataque", asTotal, asTotal - s.as, 3], ["Prob. de crítico", Math.min(b.crit, 100), b.crit, 0, "%"],
      ["Vel. de movimiento", msTotal, msTotal - s.ms, 0], ["Robo de vida", b.ls, b.ls, 0, "%"],
      ["Alcance", s.range, 0, 0], ["Regen. de vida", s.hpregen + b.hpregen, b.hpregen, 1]
    ];
    // Vida efectiva frente a daño físico y mágico (cuánto daño aguantas)
    const vida = s.hp + b.hp, arm = s.armor + b.armor, rm = s.mr + b.mr;
    datos.push(["Vida efectiva (físico)", vida * (1 + arm / 100), 0, 0], ["Vida efectiva (mágico)", vida * (1 + rm / 100), 0, 0]);

    statsEl.innerHTML = datos.map(([t, v, extra, d, suf = ""]) =>
      `<div class="bstat"><small>${t}</small><b>${fmt(v, d)}${suf}</b>${extra > 0.0005 ? `<i>+${fmt(extra, d)}${suf}</i>` : ""}</div>`).join("");

    // Efectos: el bloque <stats> y las pasivas de cada objeto tal como los describe Riot
    effEl.innerHTML = its.length ? its.map((it, i) => `
      <div class="beffect"><img src="${img.item(build.items.filter(Boolean)[i])}" alt="">
        <div><b>${esc(it.name)}</b><br>${limpia(it.description)}</div></div>`).join("")
      : `<p class="muted">Añade objetos para ver sus efectos.</p>`;
  }

  // Selector de objetos
  function elegir(slot) {
    abrirModal(`<div class="mbody" style="padding-top:26px">
        <h3 style="margin-top:0">Elige un objeto</h3>
        <div class="toolbar" style="justify-content:flex-start">
          <input class="search" id="pkSearch" type="search" placeholder="Buscar objeto..." style="max-width:none">
        </div>
        <div class="picker-list" id="pkList"></div></div>`, { estrecho: true });
    const lista = elegibles().sort((a, b) => precio(b) - precio(a));
    const pk = $("pkList"), q = $("pkSearch");
    const dibuja = () => {
      const t = norm(q.value);
      pk.innerHTML = lista.filter(it => norm(it.name).includes(t)).map(it =>
        `<div class="item" data-pick="${it.id}" tabindex="0" title="${esc(it.name)}"><img loading="lazy" src="${img.item(it.id)}" alt="">
          <div class="pr">${precio(it)}</div><div class="in">${esc(it.name)}</div></div>`).join("");
    };
    dibuja(); q.oninput = dibuja; setTimeout(() => q.focus(), 50);
    pk.onclick = e => {
      const p = e.target.closest("[data-pick]"); if (!p) return;
      const id = p.dataset.pick, it = APP.items[id];
      if (it.tags?.includes("Boots") && build.items.some((x, i) => i !== slot && x && APP.items[x].tags?.includes("Boots"))) { toast("Solo puedes llevar unas botas"); return; }
      build.items[slot] = id; guarda(); cerrarModal(); pinta();
    };
  }

  slotsEl.addEventListener("click", e => {
    const del = e.target.closest("[data-del]");
    if (del) { build.items[+del.dataset.del] = null; guarda(); pinta(); return; }
    const s = e.target.closest("[data-s]"); if (s) elegir(+s.dataset.s);
  });
  selC.oninput = () => { build.champ = selC.value; guarda(); pinta(); };
  lvl.oninput = pinta;
  $("bClear").onclick = () => { build.items = build.items.map(() => null); guarda(); pinta(); };

  // API para otros módulos
  window.buildConCampeon = id => { build.champ = id; selC.value = id; guarda(); pinta(); };
  window.buildAnadir = id => {
    const i = build.items.indexOf(null); if (i < 0) return false;
    build.items[i] = id; guarda(); pinta(); return true;
  };

  document.addEventListener("datos", llena);
  document.addEventListener("errorDatos", () => errorEn(statsEl));
})();
