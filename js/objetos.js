/* =========================================================
   objetos.js — tienda de objetos, runas y hechizos de invocador
   ========================================================= */
"use strict";

// Utilidades compartidas con build.js y juegos.js
const tipoObjeto = it => !it.from?.length ? "basico" : !it.into?.length ? "legendario" : "epico";
const precio = it => it.gold?.total ?? 0;

(() => {
  const TIERS = [["all", "ui.all"], ["basico", "it.basic"], ["epico", "it.epic"], ["legendario", "it.legendary"]];
  const TAGS = ["Damage", "SpellDamage", "AttackSpeed", "CriticalStrike", "Health", "Armor", "SpellBlock", "LifeSteal", "Mana", "AbilityHaste", "Boots", "Consumable", "Vision"];
  let tier = "all", tag = "";
  const box = $("items"), search = $("itemSearch"), sort = $("itemSort"), countEl = $("itemCount");

  function pintaFiltros() {
    $("itemTiers").innerHTML = TIERS.map(([id, k]) => `<button type="button" data-tier="${id}" class="${tier === id ? "on" : ""}">${t(k)}</button>`).join("");
    $("itemTags").innerHTML = TAGS.map(id => `<button type="button" data-tag="${id}" class="${tag === id ? "on" : ""}">${t("tag." + id)}</button>`).join("");
  }
  $("itemTiers").addEventListener("click", e => { const b = e.target.closest("[data-tier]"); if (!b) return; tier = b.dataset.tier; pintaFiltros(); pintar(); });
  $("itemTags").addEventListener("click", e => { const b = e.target.closest("[data-tag]"); if (!b) return; tag = tag === b.dataset.tag ? "" : b.dataset.tag; pintaFiltros(); pintar(); });

  function pintar() {
    if (!APP.listo) return;
    const q = norm(search.value.trim());
    const l = APP.itemList.filter(it => (tier === "all" || tipoObjeto(it) === tier) && (!tag || it.tags?.includes(tag)) &&
      (norm(it.name).includes(q) || (it.colloq && norm(it.colloq).includes(q))));
    const s = sort.value;
    l.sort(s === "price" ? (a, b) => precio(a) - precio(b) || a.name.localeCompare(b.name)
         : s === "priced" ? (a, b) => precio(b) - precio(a) || a.name.localeCompare(b.name)
         : (a, b) => a.name.localeCompare(b.name));
    box.innerHTML = l.map(it => `<div class="item" tabindex="0" data-item="${it.id}" title="${esc(it.name)}">
        <img loading="lazy" src="${img.item(it.id)}" alt="${esc(it.name)}"><div class="pr">${precio(it)}</div><div class="in">${esc(it.name)}</div></div>`).join("")
      || `<p class="empty" style="display:block;grid-column:1/-1">${t("it.none")}</p>`;
    countEl.innerHTML = t("it.count", { n: l.length, t: APP.itemList.length });
  }
  [search, sort].forEach(el => el.addEventListener("input", pintar));
  box.addEventListener("click", e => { const it = e.target.closest("[data-item]"); if (it) abrirObjeto(it.dataset.item); });
  box.addEventListener("keydown", e => { const it = e.target.closest("[data-item]"); if (it && e.key === "Enter") abrirObjeto(it.dataset.item); });

  function abrirObjeto(id) {
    const it = APP.items[id]; if (!it) return;
    ponerHash("objeto/" + id);
    const mini = ids => (ids || []).filter(x => APP.items[x]).map(x =>
      `<button type="button" data-to="${x}" title="${esc(APP.items[x].name)}"><img src="${img.item(x)}" alt=""><small>${precio(APP.items[x])}</small></button>`).join("");
    const desde = mini(it.from), hacia = mini([...new Set(it.into || [])].filter(x => APP.itemList.some(o => o.id === x)));
    abrirModal(`
      <div class="item-head"><img src="${img.item(id)}" alt="">
        <div><h2>${esc(it.name)}</h2>
          <div><span class="gold">${t("it.gold", { n: precio(it) })}</span>
            ${it.from?.length ? `<span class="muted"> · ${t("it.combine", { n: it.gold.base })}</span>` : ""}
            <span class="muted"> · ${t("it.sell", { n: it.gold.sell })}</span></div>
          <div class="tags">${(it.tags || []).filter(x => TAGS.includes(x)).map(x => `<span class="tag">${t("tag." + x)}</span>`).join("")}</div>
        </div>
      </div>
      <div class="mbody">
        ${it.plaintext ? `<p class="muted" style="margin-top:12px">${esc(it.plaintext)}</p>` : ""}
        <div class="idesc">${limpia(it.description)}</div>
        ${desde ? `<h3>${t("it.from")}</h3><div class="recipe">${desde}</div>` : ""}
        ${hacia ? `<h3>${t("it.into")}</h3><div class="recipe">${hacia}</div>` : ""}
        <div class="mactions" style="margin-top:22px">
          ${tipoObjeto(it) !== "basico" ? `<button class="btn sm" type="button" id="iBuild">${icon("hammer")}${t("it.addBuild")}</button>` : ""}
          <button class="btn sm ghost" type="button" id="iLink">${icon("link")}${t("ch.copyLink")}</button>
        </div>
      </div>`, { estrecho: true });
    mbox.querySelectorAll("[data-to]").forEach(b => b.onclick = () => abrirObjeto(b.dataset.to));
    $("iLink").onclick = () => copiarEnlace("objeto/" + id);
    const ib = $("iBuild");
    if (ib) ib.onclick = () => toast(window.buildAnadir?.(id) ? t("it.added") : t("it.full"));
  }
  window.abrirObjeto = abrirObjeto;
  rutas.objeto = abrirObjeto;

  /* ---------- runas ---------- */
  const tabs = $("runeTabs"), tree = $("runeTree");
  let arbol = 0;
  function pintaRunas() {
    if (!APP.runes.length) return;
    tabs.innerHTML = APP.runes.map((r, i) => `<button type="button" class="${i === arbol ? "on" : ""}" data-t="${i}"><img src="${img.rune(r.icon)}" alt="">${esc(r.name)}</button>`).join("");
    const r = APP.runes[arbol];
    tree.innerHTML = `<div class="rune-rows">${r.slots.map((s, i) => `<div class="rune-row${i === 0 ? " key" : ""}">${s.runes.map(x =>
        `<button class="rune" type="button" data-r="${x.id}" title="${esc(x.name)}"><img src="${img.rune(x.icon)}" alt="${esc(x.name)}"></button>`).join("")}</div>`).join("")}</div>
      <div class="rune-info" id="runeInfo"></div>`;
    const todas = r.slots.flatMap(s => s.runes);
    const ver = id => {
      const x = todas.find(y => y.id === id);
      tree.querySelectorAll(".rune").forEach(b => b.classList.toggle("on", +b.dataset.r === id));
      $("runeInfo").innerHTML = `<span class="tag acc">${esc(r.name)}</span><h4>${esc(x.name)}</h4><p>${limpia(x.longDesc || x.shortDesc)}</p>`;
    };
    tree.querySelectorAll(".rune").forEach(b => { b.onclick = () => ver(+b.dataset.r); b.onmouseenter = () => ver(+b.dataset.r); });
    ver(todas[0].id);
  }
  tabs.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) { arbol = +b.dataset.t; pintaRunas(); } });

  function pintaHechizos() {
    $("spells").innerHTML = APP.spells.map(s => `<div class="spell"><img loading="lazy" src="${img.spell(s.image.full)}" alt="">
      <div><h4>${esc(s.name)}</h4><small>${t("ru.cdLevel", { cd: s.cooldownBurn, lv: s.summonerLevel })}</small><p>${limpia(s.description)}</p></div></div>`).join("");
  }

  document.addEventListener("cargando", () => { cargando(box, 30); countEl.textContent = t("ui.loading"); });
  document.addEventListener("errorDatos", () => { errorEn(box); countEl.textContent = ""; errorEn(tree); $("spells").innerHTML = ""; });
  document.addEventListener("datos", () => { pintaFiltros(); pintar(); pintaRunas(); pintaHechizos(); });
  document.addEventListener("idioma", pintaFiltros);
})();
