/* =========================================================
   campeones.js — cuadrícula, ficha con habilidades y comparador
   ========================================================= */
"use strict";

(() => {
  const fBox = $("filters"), cBox = $("champs"), search = $("search"), empty = $("empty"),
        diffSel = $("diffSel"), sortSel = $("sortSel"), countEl = $("count");
  let filtro = "all", visibles = [];

  /* ---------- filtros ---------- */
  const filtros = [{ id:"all", name:"Todos" }, { id:"fav", name:"★ Favoritos" },
    ...Object.entries(clases).map(([id, name]) => ({ id, name }))];
  filtros.forEach(f => {
    const b = document.createElement("button");
    b.textContent = f.name; if (f.id === "all") b.className = "on";
    b.onclick = () => { filtro = f.id; fBox.querySelectorAll("button").forEach(x => x.classList.remove("on")); b.classList.add("on"); pintar(); };
    fBox.appendChild(b);
  });

  /* ---------- cuadrícula ---------- */
  function pintar() {
    if (!APP.listo) return;
    const q = norm(search.value.trim()), d = +diffSel.value, s = sortSel.value;
    visibles = APP.champs.filter(c =>
      (filtro === "all" || (filtro === "fav" ? APP.favs.has(c.id) : c.tags.includes(filtro))) &&
      (!d || nivel(c.info.difficulty) === d) && norm(c.name).includes(q));
    const porNombre = (a, b) => a.name.localeCompare(b.name);
    visibles.sort(s === "za" ? (a, b) => -porNombre(a, b)
               : s === "diff" ? (a, b) => a.info.difficulty - b.info.difficulty || porNombre(a, b)
               : s === "diffd" ? (a, b) => b.info.difficulty - a.info.difficulty || porNombre(a, b)
               : porNombre);
    cBox.innerHTML = visibles.map(c => `
      <div class="champ" data-id="${c.id}" tabindex="0" title="${esc(c.name)}, ${esc(c.title)}">
        <button class="fav${APP.favs.has(c.id) ? " on" : ""}" data-fav="${c.id}" aria-label="Favorito">${APP.favs.has(c.id) ? "★" : "☆"}</button>
        <div class="ph"><img loading="lazy" src="${img.champ(c)}" alt="${esc(c.name)}"></div>
        <div class="nm">${esc(c.name)}</div>
        <div class="tg">${c.tags.map(t => clases[t] || t).join(" · ")}</div>
      </div>`).join("");
    countEl.innerHTML = `Mostrando <b>${visibles.length}</b> de <b>${APP.champs.length}</b> campeones · Parche ${APP.ver}`;
    empty.textContent = filtro === "fav" && !APP.favs.size ? "Aún no tienes favoritos. Pulsa ☆ en cualquier campeón." : "No se ha encontrado ningún campeón.";
    empty.style.display = visibles.length ? "none" : "block";
  }
  [search, diffSel, sortSel].forEach(el => el.addEventListener("input", pintar));

  cBox.addEventListener("click", e => {
    const f = e.target.closest("[data-fav]");
    if (f) { e.stopPropagation(); toggleFav(f.dataset.fav); return; }
    const c = e.target.closest(".champ"); if (c) abrir(c.dataset.id);
  });
  cBox.addEventListener("keydown", e => { const c = e.target.closest(".champ"); if (c && e.key === "Enter" && e.target === c) abrir(c.dataset.id); });
  $("randomBtn").onclick = () => { const l = visibles.length ? visibles : APP.champs; if (l.length) abrir(azar(l).id); };

  document.addEventListener("cargando", () => { cargando(cBox); countEl.textContent = "Cargando campeones..."; });
  document.addEventListener("errorDatos", () => { countEl.textContent = ""; errorEn(cBox); });
  document.addEventListener("datos", () => { pintar(); llenaComparador(); });
  document.addEventListener("favs", () => { pintar(); });

  /* ---------- ficha ---------- */
  async function abrir(id) {
    if (!APP.champMap[id]) return;
    ponerHash("campeon/" + id);
    abrirModal(`<div class="splash"></div><div class="mbody"><p class="muted">Cargando habilidades...</p></div>`);
    try { ficha(await champFull(id)); }
    catch (e) { mbox.querySelector(".mbody").innerHTML = `<div class="err">No se pudo cargar este campeón.<br><button class="btn sm" id="retryC">Reintentar</button></div>`; $("retryC").onclick = () => abrir(id); }
  }
  window.abrirCampeon = abrir;
  rutas.campeon = id => { const c = APP.champMap[id] || buscaCampeon(id); if (c) abrir(c.id); };

  function ficha(c) {
    const habs = [
      { k:"P", tipo:"Pasiva", name:c.passive.name, desc:c.passive.description, img:img.passive(c.passive.image.full) },
      ...c.spells.map((s, i) => ({ k:"QWER"[i], tipo: i === 3 ? "Definitiva (R)" : "Habilidad " + "QWE"[i], name:s.name, desc:s.description,
        img:img.spell(s.image.full), cd:s.cooldownBurn, cost:s.costBurn, range:s.rangeBurn }))
    ];
    const i = c.info, lista = visibles.length ? visibles : APP.champs;
    const idx = Math.max(0, lista.findIndex(x => x.id === c.id));
    const prev = lista[(idx - 1 + lista.length) % lista.length], next = lista[(idx + 1) % lista.length];
    const tipsHtml = (arr, t, cls) => arr?.length ? `<div class="${cls}"><h4>${t}</h4><ul>${arr.map(x => `<li>${limpia(x)}</li>`).join("")}</ul></div>` : "";
    const esFav = APP.favs.has(c.id);

    abrirModal(`
      <div class="splash" style="background-image:url('${img.splash(c.id)}')">
        <div class="ttl">
          <h2>${esc(c.name)}</h2>
          <div class="sub">${esc(c.title)}</div>
          <div class="chips">${c.tags.map(t => `<span class="chip">${clases[t] || t}</span>`).join("")}
            <span class="chip g">${recursos[c.partype] ?? c.partype}</span>
            <span class="chip g">Dificultad: ${nivelTxt[nivel(i.difficulty)]}</span></div>
        </div>
      </div>
      <div class="mbody">
        <div class="mactions">
          <button class="btn sm" id="fFav">${esFav ? "★ En favoritos" : "☆ Añadir a favoritos"}</button>
          <button class="btn sm" id="fCmp">⚖ Comparar</button>
          <button class="btn sm" id="fBuild">🛠 Probar build</button>
          <button class="btn sm" id="fLink">🔗 Copiar enlace</button>
        </div>
        <div class="bars">
          ${[["Ataque", i.attack], ["Defensa", i.defense], ["Magia", i.magic], ["Dificultad", i.difficulty]].map(([n, v]) =>
            `<div class="bar"><small><span>${n}</span><span>${v}/10</span></small><div><span data-w="${v * 10}"></span></div></div>`).join("")}
        </div>
        <h3>Habilidades</h3>
        <div class="ab-tabs">${habs.map((h, n) => `<button class="ab-tab${n ? "" : " on"}" data-n="${n}" title="${esc(h.name)}"><img src="${h.img}" alt="${esc(h.name)}"><b>${h.k}</b></button>`).join("")}</div>
        <div class="ab-info" id="abInfo"></div>
        <h3>Historia</h3>
        <p class="lore">${limpia(c.lore)}</p>
        ${(c.allytips?.length || c.enemytips?.length) ? `<h3>Consejos</h3><div class="tips">${tipsHtml(c.allytips, "Jugando con " + esc(c.name), "")}${tipsHtml(c.enemytips, "Jugando contra " + esc(c.name), "en")}</div>` : ""}
        <h3>Aspectos (${c.skins.length})</h3>
        <div class="skins">${c.skins.map(s => `<figure><img loading="lazy" src="${img.loading(c.id, s.num)}" alt="${esc(s.name)}"><figcaption>${s.num === 0 ? "Clásico" : esc(s.name)}</figcaption></figure>`).join("")}</div>
        <div class="mnav">
          <button class="btn sm" data-go="${prev.id}">← ${esc(prev.name)}</button>
          <button class="btn sm" data-go="${next.id}">${esc(next.name)} →</button>
        </div>
      </div>`, {
        onKey: e => {
          if (e.key === "ArrowRight") abrir(next.id);
          if (e.key === "ArrowLeft") abrir(prev.id);
        }
      });

    const info = $("abInfo");
    const verHab = n => {
      const h = habs[n];
      mbox.querySelectorAll(".ab-tab").forEach(t => t.classList.toggle("on", +t.dataset.n === n));
      const meta = h.k === "P" ? "" : `<div class="ab-meta">
          ${h.cd ? `<span>⏱ Enfriamiento: <b>${h.cd} s</b></span>` : ""}
          ${h.cost && h.cost !== "0" ? `<span>💧 Coste: <b>${h.cost} ${recursos[c.partype] ?? ""}</b></span>` : ""}
          ${h.range && h.range !== "25000" ? `<span>🎯 Alcance: <b>${h.range}</b></span>` : ""}
        </div>`;
      info.innerHTML = `<span class="k">${h.tipo}</span><h4>${esc(h.name)}</h4><p>${limpia(h.desc)}</p>${meta}`;
    };
    verHab(0);
    mbox.querySelectorAll(".ab-tab").forEach(t => t.onclick = () => verHab(+t.dataset.n));
    mbox.querySelectorAll("[data-go]").forEach(b => b.onclick = () => abrir(b.dataset.go));
    $("fFav").onclick = e => { const on = toggleFav(c.id); e.target.textContent = on ? "★ En favoritos" : "☆ Añadir a favoritos"; };
    $("fLink").onclick = () => copiarEnlace("campeon/" + c.id);
    $("fCmp").onclick = () => { cerrarModal(); $("cmpA").value = c.id; pintaComparador(); $("comparador").scrollIntoView(); };
    $("fBuild").onclick = () => { cerrarModal(); window.buildConCampeon?.(c.id); $("build").scrollIntoView(); };
    requestAnimationFrame(() => mbox.querySelectorAll(".bar span[data-w]").forEach(s => s.style.width = s.dataset.w + "%"));
  }

  /* ---------- comparador ---------- */
  const cmpA = $("cmpA"), cmpB = $("cmpB"), cmpLvl = $("cmpLvl"), cmpOut = $("cmpOut");
  function llenaComparador() {
    const opts = APP.champs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    const a = cmpA.value, b = cmpB.value;
    cmpA.innerHTML = cmpB.innerHTML = opts;
    cmpA.value = APP.champMap[a] ? a : (APP.champMap.Garen ? "Garen" : APP.champs[0].id);
    cmpB.value = APP.champMap[b] ? b : (APP.champMap.Ahri ? "Ahri" : APP.champs[1 % APP.champs.length].id);
    pintaComparador();
  }
  [cmpA, cmpB, cmpLvl].forEach(el => el.addEventListener("input", pintaComparador));
  document.addEventListener("errorDatos", () => errorEn(cmpOut));

  let cmpToken = 0;
  async function pintaComparador() {
    if (!APP.listo) return;
    const n = +cmpLvl.value; $("cmpLvlTxt").textContent = n;
    const A = APP.champMap[cmpA.value], B = APP.champMap[cmpB.value];
    const sa = statsNivel(A, n), sb = statsNivel(B, n);
    const filas = [
      ["Vida", "hp", 0], ["Maná / recurso", "mp", 0], ["Daño de ataque", "ad", 1], ["Vel. de ataque", "as", 3],
      ["Armadura", "armor", 1], ["Resist. mágica", "mr", 1], ["Vel. de movimiento", "ms", 0], ["Alcance", "range", 0], ["Regen. de vida", "hpregen", 1]
    ];
    const lado = c => `<div class="cmp-side">
        <img class="pf" src="${img.champ(c)}" alt="${esc(c.name)}" data-open="${c.id}">
        <h3>${esc(c.name)}</h3><div class="sub">${esc(c.title)}</div>
        <div class="chips" style="justify-content:center">${c.tags.map(t => `<span class="chip">${clases[t] || t}</span>`).join("")}</div>
        <div class="cmp-abs" id="abs-${c.id}"></div></div>`;
    cmpOut.innerHTML = lado(A) + `<div class="cmp-mid">VS</div>` + lado(B) +
      `<div class="cmp-rows">
        ${[["Ataque", "attack"], ["Defensa", "defense"], ["Magia", "magic"], ["Dificultad", "difficulty"]].map(([t, k]) => {
          const a = A.info[k], b = B.info[k];
          return `<div class="cmp-row"><span class="${a > b ? "win" : ""}">${a}/10</span><span>${t}</span><span class="${b > a ? "win" : ""}">${b}/10</span></div>`;
        }).join("")}
        ${filas.map(([t, k, d]) => {
          const a = sa[k], b = sb[k], mejor = Math.abs(a - b) > 0.001;
          return `<div class="cmp-row"><span class="${mejor && a > b ? "win" : ""}">${fmt(a, d)}</span><span>${t}</span><span class="${mejor && b > a ? "win" : ""}">${fmt(b, d)}</span></div>`;
        }).join("")}
      </div>`;
    cmpOut.querySelectorAll("[data-open]").forEach(el => el.onclick = () => abrir(el.dataset.open));

    // Iconos de habilidades (se descargan aparte)
    const tk = ++cmpToken;
    for (const c of [A, B]) {
      champFull(c.id).then(f => {
        if (tk !== cmpToken) return;
        const box = $("abs-" + c.id); if (!box) return;
        box.innerHTML = [`<img src="${img.passive(f.passive.image.full)}" title="P: ${esc(f.passive.name)}" alt="">`,
          ...f.spells.map((s, i) => `<img src="${img.spell(s.image.full)}" title="${"QWER"[i]}: ${esc(s.name)}" alt="">`)].join("");
      }).catch(() => {});
    }
  }
})();
