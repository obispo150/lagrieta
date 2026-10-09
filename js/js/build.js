/* =========================================================
   build.js — simulador de build (campeón + nivel + 6 objetos)
   ========================================================= */
"use strict";

(() => {
  const box = $("buildBox");
  let build = store.get("build", { champ: "", items: [null, null, null, null, null, null], lvl: 18 });
  if (!build.lvl) build.lvl = 18;

  // Estadísticas numéricas que da Data Dragon (otras solo vienen en el texto del objeto)
  const MAPA = {
    FlatHPPoolMod: ["hp", 1], FlatMPPoolMod: ["mp", 1], FlatPhysicalDamageMod: ["ad", 1], FlatMagicDamageMod: ["ap", 1],
    FlatArmorMod: ["armor", 1], FlatSpellBlockMod: ["mr", 1], PercentAttackSpeedMod: ["asPct", 100],
    FlatMovementSpeedMod: ["msFlat", 1], PercentMovementSpeedMod: ["msPct", 100], FlatCritChanceMod: ["crit", 100],
    PercentLifeStealMod: ["ls", 100], FlatHPRegenMod: ["hpregen", 1]
  };
  const CATS = {
    all: () => true,
    ad: it => it.tags?.some(x => ["Damage", "CriticalStrike", "ArmorPenetration"].includes(x)),
    ap: it => it.tags?.some(x => ["SpellDamage", "MagicPenetration", "Mana"].includes(x)),
    tank: it => it.tags?.some(x => ["Health", "Armor", "SpellBlock"].includes(x)),
    as: it => it.tags?.includes("AttackSpeed"),
    boots: it => it.tags?.includes("Boots")
  };
  const guarda = () => store.set("build", build);
  const elegibles = () => APP.itemList.filter(it => (tipoObjeto(it) !== "basico" || it.tags?.includes("Boots")) && !it.tags?.includes("Consumable") && !it.tags?.includes("Trinket"));

  function estructura() {
    box.innerHTML = `
      <div class="bld">
        <aside class="bld-side panel">
          <button class="bld-champ" id="bChamp" type="button"></button>
          <div><div class="lbl"><span>${t("b.level")}</span></div>
            <div class="lvl"><input type="range" id="bLvl" min="1" max="18" value="${build.lvl}"><b id="bLvlTxt">${build.lvl}</b></div></div>
          <div><div class="lbl"><span>${t("b.items")}</span><button class="btn sm ghost" type="button" id="bClear">${icon("refresh")}${t("b.clear")}</button></div>
            <div class="slots" id="bSlots"></div></div>
          <div class="bld-cost"><span>${t("b.total")}</span><b id="bCost">0</b></div>
        </aside>
        <div class="bld-main">
          <div class="panel"><h3>${t("b.stats")}</h3>
            <table class="stat-table"><thead><tr><th></th><th>${t("b.base")}</th><th>${t("b.fromItems")}</th><th>${t("b.totalCol")}</th></tr></thead><tbody id="bStats"></tbody></table>
            <p class="note">${t("b.note")}</p></div>
          <div class="panel"><h3>${t("b.effects")}</h3><div class="effects" id="bEffects"></div></div>
        </div>
      </div>`;
    $("bChamp").onclick = () => elegirCampeon(t("b.pickChamp"), id => { build.champ = id; guarda(); pinta(); });
    $("bLvl").oninput = e => { build.lvl = +e.target.value; guarda(); pinta(); };
    $("bClear").onclick = () => { build.items = build.items.map(() => null); guarda(); pinta(); };
    $("bSlots").onclick = e => {
      const del = e.target.closest("[data-del]");
      if (del) { e.stopPropagation(); build.items[+del.dataset.del] = null; guarda(); pinta(); return; }
      const s = e.target.closest("[data-s]"); if (s) elegirObjeto(+s.dataset.s);
    };
  }

  function pinta() {
    if (!APP.listo) return;
    if (!APP.champMap[build.champ]) build.champ = APP.champMap.Jinx ? "Jinx" : APP.champs[0].id;
    build.items = build.items.map(id => id && APP.items[id] ? id : null);
    const c = APP.champMap[build.champ], n = build.lvl;
    $("bLvlTxt").textContent = n;
    $("bChamp").innerHTML = `<img src="${img.champ(c)}" alt=""><span><small>${t("b.champion")}</small><b>${esc(c.name)}</b><em>${t("b.change")}</em></span>`;

    $("bSlots").innerHTML = build.items.map((id, i) => id
      ? `<button class="slot full" type="button" data-s="${i}" title="${esc(APP.items[id].name)}"><img src="${img.item(id)}" alt=""><span class="x" data-del="${i}">${icon("x")}</span></button>`
      : `<button class="slot" type="button" data-s="${i}" aria-label="${t("b.pickItem")}">${icon("bag")}</button>`).join("");

    const ids = build.items.filter(Boolean), its = ids.map(id => APP.items[id]);
    $("bCost").textContent = fmt(its.reduce((s, it) => s + precio(it), 0));

    const b = { hp: 0, mp: 0, ad: 0, ap: 0, armor: 0, mr: 0, asPct: 0, msFlat: 0, msPct: 0, crit: 0, ls: 0, hpregen: 0 };
    its.forEach(it => Object.entries(it.stats || {}).forEach(([k, v]) => { if (MAPA[k]) b[MAPA[k][0]] += v * MAPA[k][1]; }));
    const s = statsNivel(c, n);
    const asTot = c.stats.attackspeed * (1 + (s.asBonusPct + b.asPct) / 100);
    const msTot = (s.ms + b.msFlat) * (1 + b.msPct / 100);
    const vida = s.hp + b.hp, arm = s.armor + b.armor, rm = s.mr + b.mr;
    const filas = [
      ["heart", "st.hp", s.hp, b.hp, vida, 0], ["drop", "st.mp", s.mp, b.mp, s.mp + b.mp, 0],
      ["swords", "st.ad", s.ad, b.ad, s.ad + b.ad, 0], ["bolt", "st.ap", 0, b.ap, b.ap, 0],
      ["clock", "st.as", s.as, asTot - s.as, asTot, 3], ["target", "st.crit", 0, b.crit, Math.min(b.crit, 100), 0, "%"],
      ["shield", "st.armor", s.armor, b.armor, arm, 0], ["rune", "st.mr", s.mr, b.mr, rm, 0],
      ["play", "st.ms", s.ms, msTot - s.ms, msTot, 0], ["heartFill", "st.ls", 0, b.ls, b.ls, 0, "%"],
      ["crosshair", "st.range", s.range, 0, s.range, 0], ["refresh", "st.hpregen", s.hpregen, b.hpregen, s.hpregen + b.hpregen, 1]
    ];
    const celda = (v, d, suf = "", cls = "") => `<td class="${cls}">${Math.abs(v) < 0.0005 ? "—" : (cls === "plus" ? "+" : "") + fmt(v, d) + suf}</td>`;
    $("bStats").innerHTML = filas.map(([ic, k, base, mas, tot, d, suf]) =>
      `<tr><td>${icon(ic)}${t(k)}</td>${celda(base, d, suf)}${celda(mas, d, suf, "plus")}${celda(tot, d, suf, "tot")}</tr>`).join("") +
      `<tr class="sep"><td>${icon("shield")}${t("st.ehpP")}</td><td></td><td></td><td class="tot">${fmt(vida * (1 + arm / 100))}</td></tr>
       <tr><td>${icon("rune")}${t("st.ehpM")}</td><td></td><td></td><td class="tot">${fmt(vida * (1 + rm / 100))}</td></tr>`;

    $("bEffects").innerHTML = its.length ? its.map((it, i) => `
      <div class="effect"><img src="${img.item(ids[i])}" alt="">
        <details><summary>${esc(it.name)} <span class="gold">${precio(it)}</span></summary><p>${limpia(it.description)}</p></details></div>`).join("")
      : `<p class="muted">${t("b.noEffects")}</p>`;
  }

  function elegirObjeto(slot) {
    let cat = "all";
    abrirModal(`<div class="mhead"><h3>${t("b.pickItem")}</h3></div>
      <div class="picker-top"><label class="field">${icon("search")}<input id="pkQ" type="search" placeholder="${t("ui.search")}"></label></div>
      <div class="picker-chips chips-row" id="pkCats"></div>
      <div class="picker-grid" id="pkGrid"></div>`, { estrecho: true });
    const lista = elegibles().sort((a, b) => precio(b) - precio(a));
    const q = $("pkQ"), grid = $("pkGrid"), cats = $("pkCats");
    const dibuja = () => {
      cats.innerHTML = Object.keys(CATS).map(k => `<button type="button" data-c="${k}" class="${k === cat ? "on" : ""}">${t("b.cat." + k)}</button>`).join("");
      const f = norm(q.value);
      grid.innerHTML = lista.filter(it => CATS[cat](it) && norm(it.name).includes(f)).map(it =>
        `<button class="pk" type="button" data-pick="${it.id}" title="${esc(it.name)}"><img loading="lazy" src="${img.item(it.id)}" alt=""><small class="pr">${precio(it)}</small><small>${esc(it.name)}</small></button>`).join("");
    };
    dibuja(); q.oninput = dibuja; setTimeout(() => q.focus(), 30);
    cats.onclick = e => { const b = e.target.closest("[data-c]"); if (b) { cat = b.dataset.c; dibuja(); } };
    grid.onclick = e => {
      const p = e.target.closest("[data-pick]"); if (!p) return;
      const id = p.dataset.pick;
      if (APP.items[id].tags?.includes("Boots") && build.items.some((x, i) => i !== slot && x && APP.items[x].tags?.includes("Boots"))) { toast(t("b.oneBoots")); return; }
      build.items[slot] = id; guarda(); cerrarModal(); pinta();
    };
  }

  window.buildConCampeon = id => { build.champ = id; guarda(); pinta(); };
  window.buildAnadir = id => { const i = build.items.indexOf(null); if (i < 0) return false; build.items[i] = id; guarda(); pinta(); return true; };

  const todo = () => { estructura(); pinta(); };
  document.addEventListener("datos", todo);
  document.addEventListener("errorDatos", () => errorEn(box));
  document.addEventListener("cargando", () => { box.innerHTML = '<div class="skel" style="height:420px"></div>'; });
})();
