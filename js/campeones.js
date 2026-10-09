/* =========================================================
   campeones.js — cuadrícula, ficha con habilidades y comparador
   ========================================================= */
"use strict";

(() => {
  const fBox = $("filters"), cBox = $("champs"), search = $("search"), empty = $("empty"),
        diffSel = $("diffSel"), sortSel = $("sortSel"), countEl = $("count");
  let filtro = "all", visibles = [];
  const CLASES = ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];

  /* ---------- filtros ---------- */
  function pintaFiltros() {
    const lista = [["all", t("ui.all")], ["fav", icon("star") + t("ch.fav")], ...CLASES.map(c => [c, clase(c)])];
    fBox.innerHTML = lista.map(([id, txt]) => `<button type="button" data-f="${id}" class="${id === filtro ? "on" : ""}">${txt}</button>`).join("");
  }
  fBox.addEventListener("click", e => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    filtro = b.dataset.f; pintaFiltros(); pintar();
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
               : s === "diffd" ? (a, b) => b.info.difficulty - a.info.difficulty || porNombre(a, b) : porNombre);
    cBox.innerHTML = visibles.map(c => {
      const fav = APP.favs.has(c.id);
      return `<div class="champ" data-id="${c.id}" tabindex="0" title="${esc(c.name)}, ${esc(c.title)}">
        <button class="fav${fav ? " on" : ""}" type="button" data-fav="${c.id}" aria-label="${t("ch.fav")}">${icon(fav ? "starFill" : "star")}</button>
        <div class="ph"><img loading="lazy" src="${img.champ(c)}" alt="${esc(c.name)}"></div>
        <div class="nm">${esc(c.name)}</div>
        <div class="tg">${c.tags.map(clase).join(" · ")}</div>
      </div>`;
    }).join("");
    countEl.innerHTML = t("ch.count", { n: visibles.length, t: APP.champs.length, v: APP.ver });
    empty.textContent = filtro === "fav" && !APP.favs.size ? t("ch.noFav") : t("ch.none");
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

  document.addEventListener("cargando", () => { cargando(cBox); countEl.textContent = t("ui.loading"); });
  document.addEventListener("errorDatos", () => { countEl.textContent = ""; errorEn(cBox); errorEn(cmpOut); });
  document.addEventListener("datos", () => { pintaFiltros(); pintar(); iniciaComparador(); });
  document.addEventListener("favs", pintar);
  document.addEventListener("idioma", pintaFiltros);

  /* ---------- ficha ---------- */
  async function abrir(id) {
    if (!APP.champMap[id]) return;
    ponerHash("campeon/" + id);
    abrirModal(`<div class="splash"></div><div class="mbody"><p class="muted">${t("ch.loadingAb")}</p></div>`);
    try { ficha(await champFull(id)); }
    catch (e) {
      mbox.querySelector(".mbody").innerHTML = `<div class="err">${t("ch.failOne")}<br><button class="btn sm" type="button" id="retryC">${t("ui.retry")}</button></div>`;
      $("retryC").onclick = () => abrir(id);
    }
  }
  window.abrirCampeon = abrir;
  rutas.campeon = id => { const c = APP.champMap[id] || buscaCampeon(id); if (c) abrir(c.id); };

  function ficha(c) {
    const habs = [
      { k: "P", tipo: t("ch.passive"), name: c.passive.name, desc: c.passive.description, img: img.passive(c.passive.image.full) },
      ...c.spells.map((s, i) => ({ k: "QWER"[i], tipo: i === 3 ? t("ch.ult") : t("ch.ability", { k: "QWE"[i] }), name: s.name, desc: s.description,
        img: img.spell(s.image.full), cd: s.cooldownBurn, cost: s.costBurn, range: s.rangeBurn }))
    ];
    const inf = c.info, lista = visibles.length ? visibles : APP.champs;
    const idx = Math.max(0, lista.findIndex(x => x.id === c.id));
    const prev = lista[(idx - 1 + lista.length) % lista.length], next = lista[(idx + 1) % lista.length];
    const tips = (arr, titulo, cls) => arr?.length ? `<div class="${cls}"><h4>${titulo}</h4><ul>${arr.map(x => `<li>${limpia(x)}</li>`).join("")}</ul></div>` : "";
    const favBtn = () => APP.favs.has(c.id) ? icon("starFill") + t("ch.inFav") : icon("star") + t("ch.addFav");

    abrirModal(`
      <div class="splash" style="background-image:url('${img.splash(c.id)}')">
        <div class="ttl">
          <h2>${esc(c.name)}</h2>
          <div class="sub">${esc(c.title)}</div>
          <div class="tags">${c.tags.map(tg => `<span class="tag">${clase(tg)}</span>`).join("")}
            <span class="tag">${recurso(c.partype)}</span>
            <span class="tag acc">${t("ch.diffLabel", { d: nivelTxt(nivel(inf.difficulty)) })}</span></div>
        </div>
      </div>
      <div class="mbody">
        <div class="mactions">
          <button class="btn sm" type="button" id="fFav">${favBtn()}</button>
          <button class="btn sm" type="button" id="fCmp">${icon("scale")}${t("ch.compare")}</button>
          <button class="btn sm" type="button" id="fBuild">${icon("hammer")}${t("ch.tryBuild")}</button>
          <button class="btn sm ghost" type="button" id="fLink">${icon("link")}${t("ch.copyLink")}</button>
        </div>
        <div class="bars">
          ${[["ch.attack", inf.attack], ["ch.defense", inf.defense], ["ch.magic", inf.magic], ["ch.difficulty", inf.difficulty]].map(([k, v]) =>
            `<div class="bar"><small><span>${t(k)}</span><span>${v}/10</span></small><div><span data-w="${v * 10}"></span></div></div>`).join("")}
        </div>
        <h3>${t("ch.abilities")}</h3>
        <div class="ab-tabs">${habs.map((h, n) => `<button class="ab-tab${n ? "" : " on"}" type="button" data-n="${n}" title="${esc(h.name)}"><img src="${h.img}" alt="${esc(h.name)}"><b>${h.k}</b></button>`).join("")}</div>
        <div class="ab-info" id="abInfo"></div>
        <h3>${t("ch.lore")}</h3>
        <p class="lore">${limpia(c.lore)}</p>
        ${(c.allytips?.length || c.enemytips?.length) ? `<h3>${t("ch.tips")}</h3><div class="tips">${tips(c.allytips, t("ch.playing", { n: esc(c.name) }), "")}${tips(c.enemytips, t("ch.against", { n: esc(c.name) }), "en")}</div>` : ""}
        <h3>${t("ch.skins")} <span class="muted" id="skinCount">(${c.skins.length})</span></h3>
        <div class="skins" id="skins">${c.skins.map(s => `<figure><img loading="lazy" src="${img.loading(c.id, s.num)}" alt="${esc(s.name)}"><figcaption>${s.num === 0 ? t("ch.classic") : esc(s.name)}</figcaption></figure>`).join("")}</div>
        <div class="mnav">
          <button class="btn sm" type="button" data-go="${prev.id}">${icon("chevLeft")}${esc(prev.name)}</button>
          <button class="btn sm" type="button" data-go="${next.id}">${esc(next.name)}${icon("chevRight")}</button>
        </div>
      </div>`, {
        onKey: e => { if (e.key === "ArrowRight") abrir(next.id); if (e.key === "ArrowLeft") abrir(prev.id); }
      });

    // Algunas entradas de aspectos (cromas y variantes) no tienen imagen: se quitan al fallar la carga
    const skinsBox = $("skins");
    const recuenta = () => { const el = $("skinCount"); if (el) el.textContent = `(${skinsBox.querySelectorAll("figure").length})`; };
    skinsBox.querySelectorAll("img").forEach(im => {
      im.addEventListener("error", () => { im.closest("figure").remove(); recuenta(); }, { once: true });
    });

    const info = $("abInfo");
    const verHab = n => {
      const h = habs[n];
      mbox.querySelectorAll(".ab-tab").forEach(b => b.classList.toggle("on", +b.dataset.n === n));
      const meta = h.k === "P" ? "" : `<div class="ab-meta">
          ${h.cd ? `<span>${icon("clock")}${t("ch.cd")} <b>${h.cd} s</b></span>` : ""}
          ${h.cost && h.cost !== "0" ? `<span>${icon("drop")}${t("ch.cost")} <b>${h.cost} ${recurso(c.partype)}</b></span>` : ""}
          ${h.range && h.range !== "25000" ? `<span>${icon("target")}${t("ch.range")} <b>${h.range}</b></span>` : ""}
        </div>`;
      info.innerHTML = `<span class="k">${h.tipo}</span><h4>${esc(h.name)}</h4><p>${limpia(h.desc)}</p>${meta}`;
    };
    verHab(0);
    mbox.querySelectorAll(".ab-tab").forEach(b => b.onclick = () => verHab(+b.dataset.n));
    mbox.querySelectorAll("[data-go]").forEach(b => b.onclick = () => abrir(b.dataset.go));
    $("fFav").onclick = e => { toggleFav(c.id); e.currentTarget.innerHTML = favBtn(); };
    $("fLink").onclick = () => copiarEnlace("campeon/" + c.id);
    $("fCmp").onclick = () => { cerrarModal(); cmp.a = c.id; guardaCmp(); location.hash = "#/comparador"; pintaComparador(); };
    $("fBuild").onclick = () => { cerrarModal(); window.buildConCampeon?.(c.id); location.hash = "#/build"; };
    requestAnimationFrame(() => mbox.querySelectorAll(".bar span[data-w]").forEach(s => s.style.width = s.dataset.w + "%"));
  }

  /* ---------- comparador ---------- */
  const cmpA = $("cmpA"), cmpB = $("cmpB"), cmpLvl = $("cmpLvl"), cmpOut = $("cmpOut");
  const cmp = store.get("cmp", { a: "Garen", b: "Ahri" });
  const guardaCmp = () => store.set("cmp", cmp);

  function iniciaComparador() {
    if (!APP.champMap[cmp.a]) cmp.a = APP.champs[0].id;
    if (!APP.champMap[cmp.b]) cmp.b = APP.champs[1 % APP.champs.length].id;
    pintaComparador();
  }
  const botonCampeon = (btn, c) => {
    btn.innerHTML = `<img src="${img.champ(c)}" alt=""><span><b>${esc(c.name)}</b><small>${c.tags.map(clase).join(" · ")}</small></span>${icon("chevDown")}`;
  };
  cmpA.onclick = () => elegirCampeon(t("b.pickChamp"), id => { cmp.a = id; guardaCmp(); pintaComparador(); });
  cmpB.onclick = () => elegirCampeon(t("b.pickChamp"), id => { cmp.b = id; guardaCmp(); pintaComparador(); });
  cmpLvl.addEventListener("input", pintaComparador);

  let token = 0;
  function pintaComparador() {
    if (!APP.listo) return;
    const n = +cmpLvl.value; $("cmpLvlTxt").textContent = n;
    const A = APP.champMap[cmp.a], B = APP.champMap[cmp.b];
    botonCampeon(cmpA, A); botonCampeon(cmpB, B);
    const sa = statsNivel(A, n), sb = statsNivel(B, n);
    const filas = [["st.hp", "hp", 0], ["st.mp", "mp", 0], ["st.ad", "ad", 1], ["st.as", "as", 3], ["st.armor", "armor", 1],
      ["st.mr", "mr", 1], ["st.ms", "ms", 0], ["st.range", "range", 0], ["st.hpregen", "hpregen", 1]];
    const lado = (c, r) => `<div class="cmp-side${r ? " r" : ""}"><img src="${img.champ(c)}" alt="" data-open="${c.id}">
      <div><b>${esc(c.name)}</b><small>${esc(c.title)}</small><div class="cmp-abs" data-abs="${r ? "b" : "a"}"></div></div></div>`;
    const fila = (txt, a, b, d, suf = "") => {
      const dif = Math.abs(a - b) > 0.0005;
      return `<div class="cmp-row"><span class="${dif && a > b ? "win" : ""}">${fmt(a, d)}${suf}</span><span>${txt}</span><span class="${dif && b > a ? "win" : ""}">${fmt(b, d)}${suf}</span></div>`;
    };
    cmpOut.innerHTML = `<div class="cmp-row head">${lado(A, false)}<span>VS</span>${lado(B, true)}</div>` +
      [["ch.attack", "attack"], ["ch.defense", "defense"], ["ch.magic", "magic"], ["ch.difficulty", "difficulty"]].map(([k, f]) => fila(t(k), A.info[f], B.info[f], 0, "/10")).join("") +
      filas.map(([k, f, d]) => fila(t(k), sa[f], sb[f], d)).join("");
    cmpOut.querySelectorAll("[data-open]").forEach(el => el.onclick = () => abrir(el.dataset.open));
    const tk = ++token;
    [[A, "a"], [B, "b"]].forEach(([c, k]) => champFull(c.id).then(f => {
      if (tk !== token) return;
      const box = cmpOut.querySelector(`[data-abs="${k}"]`); if (!box) return;
      box.innerHTML = [`<img src="${img.passive(f.passive.image.full)}" title="P · ${esc(f.passive.name)}" alt="">`,
        ...f.spells.map((s, i) => `<img src="${img.spell(s.image.full)}" title="${"QWER"[i]} · ${esc(s.name)}" alt="">`)].join("");
    }).catch(() => {}));
  }
})();
