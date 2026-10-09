/* =========================================================
   juegos.js — Adivina el campeón y Quiz
   ========================================================= */
"use strict";

/* ============ ADIVINA EL CAMPEÓN ============ */
(() => {
  const box = $("guessBox"), modesEl = $("guessModes");
  const MODOS = [["imagen", "gs.image", "eye"], ["habilidad", "gs.ability", "bolt"], ["titulo", "gs.titleMode", "book"]];
  const MAX = 5, ZOOM = [700, 480, 320, 200, 130, 100];
  let modo = "imagen", ronda = null, racha = 0, mejor = store.get("adivinaMejor", 0);

  function pintaModos() {
    modesEl.innerHTML = MODOS.map(([id, k, ic]) => `<button type="button" data-m="${id}" class="${id === modo ? "on" : ""}">${icon(ic)}${t(k)}</button>`).join("");
  }
  modesEl.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (b && b.dataset.m !== modo) { modo = b.dataset.m; pintaModos(); nueva(); } });

  async function nueva() {
    if (!APP.listo) return;
    const c = azar(APP.champs);
    ronda = { c, fallos: [], fin: false, pos: `${Math.floor(Math.random() * 80) + 10}% ${Math.floor(Math.random() * 60) + 10}%` };
    if (modo === "habilidad") {
      box.innerHTML = `<p class="muted">${t("ui.loading")}</p>`;
      try {
        const f = await champFull(c.id);
        ronda.hab = azar([{ k: t("ch.passive"), name: f.passive.name, img: img.passive(f.passive.image.full) },
          ...f.spells.map((s, i) => ({ k: "QWER"[i], name: s.name, img: img.spell(s.image.full) }))]);
      } catch (e) { box.innerHTML = `<div class="err">${t("ui.error")}<br><button class="btn sm" type="button" id="gRetry">${t("ui.retry")}</button></div>`; $("gRetry").onclick = nueva; return; }
    }
    pinta();
  }

  function pistas() {
    const c = ronda.c, n = ronda.fallos.length, p = [];
    const cls = c.tags.map(clase).join(", ");
    if (modo === "habilidad") {
      if (n >= 1) p.push(t("gs.hKey", { v: ronda.hab.k }));
      if (n >= 2) p.push(t("gs.hClass", { v: cls }));
      if (n >= 3) p.push(t("gs.hName", { v: esc(ronda.hab.name) }));
      if (n >= 4) p.push(t("gs.hFirst", { v: esc(c.name[0]) }));
    } else if (modo === "titulo") {
      if (n >= 1) p.push(t("gs.hClass", { v: cls }));
      if (n >= 2) p.push(t("gs.hRes", { v: recurso(c.partype) }));
      if (n >= 3) p.push(t("gs.hDiff", { v: c.info.difficulty }));
      if (n >= 4) p.push(t("gs.hFirst", { v: esc(c.name[0]) }));
    } else {
      if (n >= 2) p.push(t("gs.hClass", { v: cls }));
      if (n >= 4) p.push(t("gs.hFirst", { v: esc(c.name[0]) }));
    }
    return p.length ? `<div class="hints">${p.map(x => `<span>${icon("info")}${x}</span>`).join("")}</div>` : "";
  }

  function pinta() {
    if (!ronda) return;
    const c = ronda.c, fin = ronda.fin;
    const zoom = fin ? 100 : ZOOM[Math.min(ronda.fallos.length, ZOOM.length - 1)];
    const pista = modo === "imagen"
      ? `<div class="g-pic" style="background-image:url('${img.splash(c.id)}');background-size:${zoom * 1.7}% ${zoom}%;background-position:${fin ? "center 20%" : ronda.pos}"></div>`
      : modo === "habilidad" ? `<img class="g-ab" src="${ronda.hab.img}" alt="${t("gs.mystery")}">`
      : `<p class="muted">${t("gs.whoIs")}</p><div class="g-title">${esc(c.title)}</div>`;

    box.innerHTML = `
      <div class="g-score"><span>${t("gs.streak")}<b>${racha}</b></span><span>${t("gs.best")}<b>${mejor}</b></span><span>${t("gs.tries")}<b>${MAX - ronda.fallos.length}</b></span></div>
      ${pista}
      ${fin ? `<div class="g-res"><img src="${img.champ(c)}" alt="">
          <div class="${ronda.ok ? "ok-t" : "ko-t"}">${t(ronda.ok ? "gs.ok" : "gs.ko")}</div>
          <p>${t("gs.was", { n: esc(c.name), t: esc(c.title) })}</p>
          <div class="g-actions"><button class="btn primary" type="button" id="gNext">${t("gs.next")}${icon("chevRight")}</button>
            <button class="btn" type="button" id="gInfo">${t("gs.sheet")}</button>
            <button class="btn" type="button" id="gShare">${icon("share")}${t("gs.share")}</button></div></div>`
      : `${pistas()}<form id="gForm"><label class="field"><input id="gInput" list="gList" placeholder="${t("gs.ph")}" autocomplete="off"></label>
          <button class="btn primary" type="submit">${t("gs.try")}</button><button class="btn ghost" type="button" id="gSkip">${t("gs.giveUp")}</button></form>
        <datalist id="gList">${APP.champs.map(x => `<option value="${esc(x.name)}">`).join("")}</datalist>`}
      ${ronda.fallos.length ? `<div class="tries">${ronda.fallos.map(f => `<span>${esc(f)}</span>`).join("")}</div>` : ""}`;

    if (fin) {
      $("gNext").onclick = nueva; $("gInfo").onclick = () => abrirCampeon(c.id);
      $("gShare").onclick = () => {
        const casillas = ronda.fallos.map(() => "🟥").join("") + (ronda.ok ? "🟩" : "");
        copiarTexto(`La Grieta · ${t("gs.title")} (${t(MODOS.find(m => m[0] === modo)[1])})\n${casillas}  ${ronda.ok ? ronda.fallos.length + 1 : "X"}/${MAX}\nlagrieta.eu/#/adivina`, t("gs.shared"));
      };
      return;
    }
    $("gForm").onsubmit = e => {
      e.preventDefault();
      const g = buscaCampeon($("gInput").value);
      if (!g) { toast(t("gs.noChamp")); return; }
      if (ronda.fallos.includes(g.name)) { toast(t("gs.repeated")); return; }
      if (g.id === c.id) { ronda.ok = ronda.fin = true; racha++; if (racha > mejor) { mejor = racha; store.set("adivinaMejor", mejor); } }
      else { ronda.fallos.push(g.name); if (ronda.fallos.length >= MAX) { ronda.fin = true; racha = 0; } }
      pinta();
      if (!ronda.fin) $("gInput").focus({ preventScroll: true });
    };
    $("gSkip").onclick = () => { ronda.fin = true; racha = 0; pinta(); };
  }

  pintaModos();
  document.addEventListener("datos", () => { if (!ronda) nueva(); else pinta(); });
  document.addEventListener("idioma", () => { pintaModos(); ronda = null; });
  document.addEventListener("cargando", () => { if (!ronda) box.innerHTML = `<p class="muted">${t("ui.loading")}</p>`; });
  document.addEventListener("errorDatos", () => errorEn(box));
})();

/* ============ QUIZ ============ */
(() => {
  const box = $("quizBox"), modesEl = $("quizModes");
  let modo = "basico", idx = 0, aciertos = 0, vidas = 3, mejor = store.get("quizMejor", 0);

  const basicas = () => t("q.b").split(";;").map(b => { const [q, o, a] = b.split("|"); return { q, o: o.split(";"), a: +a }; });
  const rangos = () => t("q.ranks").split(";");

  function pintaModos() {
    modesEl.innerHTML = [["basico", "q.basic"], ["infinito", "q.infinite"]].map(([id, k]) => `<button type="button" data-m="${id}" class="${id === modo ? "on" : ""}">${t(k)}</button>`).join("");
  }
  modesEl.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (b) { modo = b.dataset.m; pintaModos(); empezar(); } });

  function empezar() { idx = 0; aciertos = 0; vidas = 3; siguiente(); }

  async function generar() {
    const otros = (c, n = 3) => mezcla(APP.champs.filter(x => x.id !== c.id)).slice(0, n);
    const tipo = azar(["titulo", "habilidad", "splash", "clase", "objeto", "precio"]);
    const c = azar(APP.champs);
    if (tipo === "titulo") { const ops = mezcla([c, ...otros(c)]); return { q: t("q.gTitle", { t: c.title }), o: ops.map(x => x.name), a: ops.indexOf(c) }; }
    if (tipo === "habilidad") {
      const f = await champFull(c.id), i = Math.floor(Math.random() * 5);
      const h = i === 0 ? { n: f.passive.name, img: img.passive(f.passive.image.full), k: t("ch.passive") } : { n: f.spells[i - 1].name, img: img.spell(f.spells[i - 1].image.full), k: "QWER"[i - 1] };
      const ops = mezcla([c, ...otros(c)]);
      return { q: t("q.gAbility", { k: h.k }), img: h.img, o: ops.map(x => x.name), a: ops.indexOf(c), extra: h.n };
    }
    if (tipo === "splash") { const ops = mezcla([c, ...otros(c)]); return { q: t("q.gSplash"), splash: img.splash(c.id), o: ops.map(x => x.name), a: ops.indexOf(c) }; }
    if (tipo === "clase") {
      const ok = clase(c.tags[0]);
      const resto = ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"].filter(x => !c.tags.includes(x)).map(clase);
      const ops = mezcla([ok, ...mezcla(resto).slice(0, 3)]);
      return { q: t("q.gClass", { n: c.name }), o: ops, a: ops.indexOf(ok) };
    }
    const legend = APP.itemList.filter(it => tipoObjeto(it) === "legendario"), it = azar(legend);
    if (tipo === "objeto") { const ops = mezcla([it, ...mezcla(legend.filter(x => x.id !== it.id)).slice(0, 3)]); return { q: t("q.gItem"), img: img.item(it.id), o: ops.map(x => x.name), a: ops.indexOf(it) }; }
    const p = precio(it), ops = mezcla([p, ...mezcla([-600, -400, -200, 200, 400, 600]).slice(0, 3).map(d => p + d)]);
    return { q: t("q.gPrice", { n: it.name }), img: img.item(it.id), o: ops.map(x => t("it.gold", { n: fmt(x) })), a: ops.indexOf(p) };
  }

  async function siguiente() {
    const bas = basicas();
    let p;
    if (modo === "basico") p = bas[idx];
    else {
      if (!APP.listo) { box.innerHTML = `<p class="muted">${t("ui.loading")}</p>`; return; }
      box.innerHTML = `<p class="muted">${t("q.generating")}</p>`;
      try { p = await generar(); } catch (e) { p = azar(bas); }
    }
    const vidasHtml = [0, 1, 2].map(i => icon(i < vidas ? "heartFill" : "heart")).join("");
    const cab = modo === "basico"
      ? `<span>${t("q.question", { n: idx + 1, t: bas.length })}</span><span>${t("q.hits", { n: aciertos })}</span>`
      : `<span>${t("q.points", { n: aciertos, r: mejor })}</span><span>${vidasHtml}</span>`;
    box.innerHTML = `<div class="prog">${cab}</div>
      ${p.img ? `<img class="qimg" src="${p.img}" alt="">` : ""}${p.splash ? `<img class="qsplash" src="${p.splash}" alt="">` : ""}
      <div class="q">${esc(p.q)}</div>
      <div class="opts">${p.o.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join("")}</div>
      ${p.extra ? `<p class="muted" id="qExtra" style="display:none;margin-top:12px">${esc(p.extra)}</p>` : ""}
      <button class="btn primary next" type="button" id="qNext">${t("q.next")}</button>`;
    box.querySelectorAll(".opts button").forEach(b => b.onclick = () => {
      const ok = +b.dataset.i === p.a;
      box.querySelectorAll(".opts button").forEach(x => { x.disabled = true; if (+x.dataset.i === p.a) x.classList.add("ok"); });
      if (ok) aciertos++; else { b.classList.add("ko"); vidas--; }
      const sp = box.querySelector(".qsplash"); if (sp) sp.style.filter = "none";
      const ex = $("qExtra"); if (ex) ex.style.display = "block";
      const fin = modo === "basico" ? idx >= bas.length - 1 : vidas <= 0;
      const nb = $("qNext"); nb.textContent = t(fin ? "q.result" : "q.next"); nb.style.display = "inline-flex";
      nb.onclick = () => { idx++; fin ? resultado() : siguiente(); };
    });
  }

  function resultado() {
    const r = rangos(), bas = basicas();
    let rango, extra;
    if (modo === "basico") { rango = r[Math.round(aciertos / bas.length * (r.length - 1))]; extra = t("q.basicRes", { n: aciertos, t: bas.length }); }
    else {
      if (aciertos > mejor) { mejor = aciertos; store.set("quizMejor", mejor); }
      rango = r[Math.min(r.length - 1, Math.floor(aciertos / 3))];
      extra = t("q.infRes", { n: aciertos, r: mejor });
    }
    box.innerHTML = `<div class="result"><p>${t("q.yourRank")}</p><b>${rango}</b><p>${extra}</p>
      <button class="btn primary" type="button" id="qAgain">${icon("refresh")}${t("q.again")}</button></div>`;
    $("qAgain").onclick = empezar;
  }

  pintaModos(); empezar();
  document.addEventListener("idioma", () => { pintaModos(); empezar(); });
})();
