/* =========================================================
   objetos.js — tienda de objetos, runas y hechizos de invocador
   ========================================================= */
"use strict";

// Utilidades de objetos compartidas con build.js y juegos.js
const tipoObjeto = it => !it.from?.length ? "basico" : !it.into?.length ? "legendario" : "epico";
const precio = it => it.gold?.total ?? 0;

(() => {
  /* ---------- OBJETOS ---------- */
  const tiers = [["all", "Todos"], ["basico", "Básicos"], ["epico", "Épicos"], ["legendario", "Legendarios"]];
  const etiquetas = [
    ["Damage","Daño de ataque"], ["SpellDamage","Poder de habilidad"], ["AttackSpeed","Vel. de ataque"], ["CriticalStrike","Crítico"],
    ["Health","Vida"], ["Armor","Armadura"], ["SpellBlock","Resist. mágica"], ["LifeSteal","Robo de vida"],
    ["Mana","Maná"], ["AbilityHaste","Celeridad"], ["Boots","Botas"], ["Consumable","Consumibles"], ["Vision","Visión"]
  ];
  let tier = "all", tag = "";
  const box = $("items"), search = $("itemSearch"), sort = $("itemSort"), countEl = $("itemCount");

  function botones(cont, lista, alClic, activo) {
    cont.innerHTML = "";
    lista.forEach(([id, txt]) => {
      const b = document.createElement("button");
      b.textContent = txt; if (id === activo) b.className = "on";
      b.onclick = () => {
        const yaOn = b.classList.contains("on");
        cont.querySelectorAll("button").forEach(x => x.classList.remove("on"));
        alClic(id, yaOn, b);
        pintar();
      };
      cont.appendChild(b);
    });
  }
  botones($("itemTiers"), tiers, (id, _, b) => { tier = id; b.classList.add("on"); }, "all");
  botones($("itemTags"), etiquetas, (id, yaOn, b) => { tag = yaOn ? "" : id; if (!yaOn) b.classList.add("on"); }, "");

  function pintar() {
    if (!APP.listo) return;
    const q = norm(search.value.trim());
    const l = APP.itemList.filter(it =>
      (tier === "all" || tipoObjeto(it) === tier) && (!tag || it.tags?.includes(tag)) &&
      (norm(it.name).includes(q) || (it.colloq && norm(it.colloq).includes(q))));
    const s = sort.value;
    l.sort(s === "price" ? (a, b) => precio(a) - precio(b) || a.name.localeCompare(b.name)
         : s === "priced" ? (a, b) => precio(b) - precio(a) || a.name.localeCompare(b.name)
         : (a, b) => a.name.localeCompare(b.name));
    box.innerHTML = l.map(it => `
      <div class="item" tabindex="0" data-item="${it.id}" title="${esc(it.name)}">
        <img loading="lazy" src="${img.item(it.id)}" alt="${esc(it.name)}">
        <div class="pr">${precio(it)}</div><div class="in">${esc(it.name)}</div>
      </div>`).join("") || `<p class="empty" style="display:block;grid-column:1/-1">No hay objetos con esos filtros.</p>`;
    countEl.innerHTML = `Mostrando <b>${l.length}</b> de <b>${APP.itemList.length}</b> objetos`;
  }
  [search, sort].forEach(el => el.addEventListener("input", pintar));
  box.addEventListener("click", e => { const it = e.target.closest("[data-item]"); if (it) abrirObjeto(it.dataset.item); });
  box.addEventListener("keydown", e => { const it = e.target.closest("[data-item]"); if (it && e.key === "Enter") abrirObjeto(it.dataset.item); });

  function abrirObjeto(id) {
    const it = APP.items[id]; if (!it) return;
    ponerHash("objeto/" + id);
    const mini = ids => (ids || []).filter(x => APP.items[x]).map(x =>
      `<button data-to="${x}" title="${esc(APP.items[x].name)}"><img src="${img.item(x)}" alt=""><small>${precio(APP.items[x])}</small></button>`).join("");
    const desde = mini(it.from), hacia = mini([...new Set(it.into || [])].filter(x => APP.itemList.some(o => o.id === x)));
    abrirModal(`
      <div class="item-head">
        <img src="${img.item(id)}" alt="">
        <div><h2>${esc(it.name)}</h2>
          <div><span class="gold">${precio(it)} de oro</span>
            ${it.from?.length ? `<span class="muted"> · combinación ${it.gold.base}</span>` : ""}
            <span class="muted"> · se vende por ${it.gold.sell}</span></div>
          <div class="chips">${(it.tags || []).map(t => `<span class="chip">${(etiquetas.find(e => e[0] === t) || [, t])[1]}</span>`).join("")}</div>
        </div>
      </div>
      <div class="mbody">
        ${it.plaintext ? `<p class="muted" style="margin-top:10px"><i>${esc(it.plaintext)}</i></p>` : ""}
        <div class="idesc">${limpia(it.description)}</div>
        ${desde ? `<h3>Se construye con</h3><div class="recipe">${desde}</div>` : ""}
        ${hacia ? `<h3>Se usa para</h3><div class="recipe">${hacia}</div>` : ""}
        <div class="mactions" style="margin-top:22px">
          <button class="btn sm" id="iLink">🔗 Copiar enlace</button>
          ${tipoObjeto(it) !== "basico" ? `<button class="btn sm" id="iBuild">🛠 Añadir a la build</button>` : ""}
        </div>
      </div>`, { estrecho: true });
    mbox.querySelectorAll("[data-to]").forEach(b => b.onclick = () => abrirObjeto(b.dataset.to));
    $("iLink").onclick = () => copiarEnlace("objeto/" + id);
    const ib = $("iBuild");
    if (ib) ib.onclick = () => { if (window.buildAnadir?.(id)) { toast("Añadido a la build"); } else toast("La build ya tiene 6 objetos"); };
  }
  window.abrirObjeto = abrirObjeto;
  rutas.objeto = abrirObjeto;

  /* ---------- RUNAS ---------- */
  const tabs = $("runeTabs"), tree = $("runeTree");
  let arbol = 0;
  function pintaRunas() {
    if (!APP.runes.length) return;
    tabs.innerHTML = APP.runes.map((t, i) =>
      `<button class="${i === arbol ? "on" : ""}" data-t="${i}"><img src="${img.rune(t.icon)}" alt="">${esc(t.name)}</button>`).join("");
    tabs.querySelectorAll("button").forEach(b => b.onclick = () => { arbol = +b.dataset.t; pintaRunas(); });
    const t = APP.runes[arbol];
    tree.innerHTML = `<div class="rune-rows">${t.slots.map((s, i) => `
        <div class="rune-row${i === 0 ? " key" : ""}">${s.runes.map(r =>
          `<button class="rune" data-r="${r.id}" title="${esc(r.name)}"><img src="${img.rune(r.icon)}" alt="${esc(r.name)}"></button>`).join("")}</div>`).join("")}
      </div><div class="rune-info" id="runeInfo"></div>`;
    const todas = t.slots.flatMap(s => s.runes);
    const ver = id => {
      const r = todas.find(x => x.id === id);
      tree.querySelectorAll(".rune").forEach(b => b.classList.toggle("on", +b.dataset.r === id));
      $("runeInfo").innerHTML = `<span class="chip g">${esc(t.name)}</span><h4 style="margin-top:10px">${esc(r.name)}</h4><p>${limpia(r.longDesc || r.shortDesc)}</p>`;
    };
    tree.querySelectorAll(".rune").forEach(b => { b.onclick = () => ver(+b.dataset.r); b.onmouseenter = () => ver(+b.dataset.r); });
    ver(todas[0].id);
  }

  /* ---------- HECHIZOS ---------- */
  function pintaHechizos() {
    $("spells").innerHTML = APP.spells.map(s => `
      <div class="spell"><img loading="lazy" src="${img.spell(s.image.full)}" alt="">
        <div><h4>${esc(s.name)}</h4><small>Enfriamiento: ${s.cooldownBurn} s · Nivel ${s.summonerLevel}</small>
        <p>${limpia(s.description)}</p></div></div>`).join("");
  }

  document.addEventListener("cargando", () => { cargando(box, 30); countEl.textContent = "Cargando objetos..."; });
  document.addEventListener("errorDatos", () => { errorEn(box); countEl.textContent = ""; errorEn(tree); $("spells").innerHTML = ""; });
  document.addEventListener("datos", () => { pintar(); pintaRunas(); pintaHechizos(); });
})();
