/* =========================================================
   draft.js — simulador de draft competitivo
   ========================================================= */
"use strict";

(() => {
  const box = $("draftBox");
  // Orden oficial del draft competitivo (B = azul, R = rojo)
  const ORDEN = [
    ["B","ban"],["R","ban"],["B","ban"],["R","ban"],["B","ban"],["R","ban"],
    ["B","pick"],["R","pick"],["R","pick"],["B","pick"],["B","pick"],["R","pick"],
    ["R","ban"],["B","ban"],["R","ban"],["B","ban"],
    ["R","pick"],["B","pick"],["B","pick"],["R","pick"]
  ];
  const TIEMPO = 30;
  const CLASES = ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];
  let st = null, timer = null, conTiempo = store.get("draftTimer", true), visible = false, filtroTxt = "", filtroCls = "all";

  const nuevo = () => ({ paso: 0, sel: null, t: TIEMPO, B: { ban: [], pick: [] }, R: { ban: [], pick: [] } });
  const usados = () => new Set([...st.B.ban, ...st.R.ban, ...st.B.pick, ...st.R.pick].filter(Boolean));
  const libres = () => { const u = usados(); return APP.champs.filter(c => !u.has(c.id)); };
  const acabado = () => st.paso >= ORDEN.length;
  const fase = p => t(p < 6 ? "d.ban1" : p < 12 ? "d.pick1" : p < 16 ? "d.ban2" : "d.pick2");

  function reset() { st = nuevo(); estructura(); arranca(); }

  function estructura() {
    box.innerHTML = `
      <div class="dr">
        <div class="dr-top">
          <div class="dr-team blue">${t("d.blue")}</div>
          <div class="dr-phase" id="dPhase"></div>
          <div class="dr-team red">${t("d.red")}</div>
        </div>
        <div class="dr-bans"><div class="ban-row blue" id="dbB"></div><div class="ban-row red" id="dbR"></div></div>
        <div class="dr-body">
          <div class="dr-col blue" id="dpB"></div>
          <div class="dr-pool" id="dPool"></div>
          <div class="dr-col red" id="dpR"></div>
        </div>
      </div>`;
    pinta();
  }

  function pinta() { equipos(); fasePanel(); pool(); }

  function equipos() {
    const act = ORDEN[st.paso];
    for (const eq of ["B", "R"]) {
      $("dp" + eq).innerHTML = Array.from({ length: 5 }, (_, i) => {
        const id = st[eq].pick[i], c = id && APP.champMap[id];
        const esAct = act && act[0] === eq && act[1] === "pick" && i === st[eq].pick.length;
        const prev = esAct && st.sel ? APP.champMap[st.sel] : null;
        const fondo = c || prev;
        return `<div class="dr-slot${fondo ? "" : " empty"}${esAct ? " act" : ""}${prev ? " preview" : ""}" style="${fondo ? `background-image:url('${img.splash(fondo.id)}')` : ""}">
          <small>${t("d.pick", { n: i + 1 })}</small><b>${fondo ? esc(fondo.name) : ""}</b></div>`;
      }).join("");
      $("db" + eq).innerHTML = Array.from({ length: 5 }, (_, i) => {
        const hecho = i < st[eq].ban.length, id = st[eq].ban[i], c = id && APP.champMap[id];
        const esAct = act && act[0] === eq && act[1] === "ban" && i === st[eq].ban.length;
        const prev = esAct && st.sel ? APP.champMap[st.sel] : null, fondo = c || prev;
        return `<div class="ban${hecho ? " done" : ""}${esAct ? " act" : ""}" title="${c ? esc(c.name) : hecho ? t("d.noBan") : ""}" style="${fondo ? `background-image:url('${img.champ(fondo)}')` : ""}"></div>`;
      }).join("");
    }
  }

  function fasePanel() {
    const el = $("dPhase");
    if (acabado()) { el.innerHTML = `<small>${t("d.turn", { n: 20 })}</small><b>${t("d.done")}</b>`; return; }
    const [eq, tipo] = ORDEN[st.paso];
    el.innerHTML = `<small>${fase(st.paso)} · ${t("d.turn", { n: st.paso + 1 })}</small>
      <b class="${eq === "B" ? "blue" : "red"}">${t(eq === "B" ? "d.blueS" : "d.redS")} ${t(tipo === "ban" ? "d.bans" : "d.picks")}</b>
      <div class="dr-timer${conTiempo ? "" : " off"}"><span id="dBar" style="width:${st.t / TIEMPO * 100}%"></span></div>`;
  }

  function pool() {
    const el = $("dPool");
    if (acabado()) {
      el.innerHTML = `<div class="dr-done">${icon("trophy", "")}<h3>${t("d.done")}</h3>
        <div class="btn-row"><button class="btn primary" type="button" id="dCopy">${icon("copy")}${t("d.copy")}</button>
        <button class="btn" type="button" id="dReset">${icon("refresh")}${t("d.reset")}</button></div></div>`;
      $("dCopy").onclick = () => copiarTexto(resumen(), t("d.copied"));
      $("dReset").onclick = reset;
      return;
    }
    const tipo = ORDEN[st.paso][1];
    el.innerHTML = `
      <div class="toolbar"><label class="field">${icon("search")}<input id="dSearch" type="search" placeholder="${t("ui.search")}" value="${esc(filtroTxt)}"></label></div>
      <div class="chips-row small" id="dCls">${[["all", t("ui.all")], ...CLASES.map(c => [c, clase(c)])].map(([k, v]) =>
        `<button type="button" data-c="${k}" class="${k === filtroCls ? "on" : ""}">${v}</button>`).join("")}</div>
      <div class="dr-grid" id="dGrid"></div>
      <div class="dr-actions">
        <button class="btn primary lg" type="button" id="dOk" ${st.sel ? "" : "disabled"}>${icon(tipo === "ban" ? "ban" : "lock")}${t(tipo === "ban" ? "d.lockBan" : "d.lockPick")}</button>
        ${tipo === "ban" ? `<button class="btn" type="button" id="dSkip">${t("d.skipBan")}</button>` : ""}
        <button class="btn" type="button" id="dRand" title="${t("d.random")}">${icon("dice")}</button>
        <button class="btn" type="button" id="dReset" title="${t("d.reset")}">${icon("refresh")}</button>
        <label><input type="checkbox" id="dTime" ${conTiempo ? "checked" : ""}> ${t("d.timer")}</label>
      </div>`;
    rejilla();
    $("dSearch").oninput = e => { filtroTxt = e.target.value; rejilla(); };
    $("dCls").onclick = e => { const b = e.target.closest("[data-c]"); if (!b) return; filtroCls = b.dataset.c; $("dCls").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); rejilla(); };
    $("dGrid").onclick = e => { const b = e.target.closest("[data-d]"); if (!b || b.disabled) return; st.sel = b.dataset.d; equipos(); rejilla(); $("dOk").disabled = false; };
    $("dGrid").ondblclick = e => { if (e.target.closest("[data-d]:not(:disabled)")) confirmar(); };
    $("dOk").onclick = () => confirmar();
    if ($("dSkip")) $("dSkip").onclick = () => { st.sel = null; confirmar(true); };
    $("dRand").onclick = () => { const l = libres(); if (l.length) { st.sel = azar(l).id; equipos(); rejilla(); $("dOk").disabled = false; } };
    $("dReset").onclick = reset;
    $("dTime").onchange = e => { conTiempo = e.target.checked; store.set("draftTimer", conTiempo); st.t = TIEMPO; fasePanel(); arranca(); };
  }

  function rejilla() {
    const u = usados(), q = norm(filtroTxt);
    $("dGrid").innerHTML = APP.champs.filter(c => norm(c.name).includes(q) && (filtroCls === "all" || c.tags.includes(filtroCls))).map(c =>
      `<button class="dch${st.sel === c.id ? " sel" : ""}" type="button" data-d="${c.id}" title="${esc(c.name)}" ${u.has(c.id) ? "disabled" : ""}><img loading="lazy" src="${img.champ(c)}" alt="${esc(c.name)}"></button>`).join("");
  }

  function confirmar(saltar = false) {
    if (acabado()) return;
    const [eq, tipo] = ORDEN[st.paso];
    if (!st.sel && tipo === "pick") return;
    if (!st.sel && tipo === "ban" && !saltar && st.t > 0) return;
    st[eq][tipo].push(st.sel);
    st.sel = null; st.paso++; st.t = TIEMPO;
    pinta();
    if (acabado()) clearInterval(timer);
  }

  function arranca() {
    clearInterval(timer);
    if (!conTiempo || !visible || !st || acabado()) return;
    timer = setInterval(() => {
      if (acabado()) return clearInterval(timer);
      st.t--;
      const bar = $("dBar"); if (bar) bar.style.width = (st.t / TIEMPO * 100) + "%";
      if (st.t <= 0) {
        // Se acabó el tiempo: un pick se elige al azar y un ban se pierde
        if (!st.sel && ORDEN[st.paso][1] === "pick") st.sel = azar(libres()).id;
        confirmar(true);
      }
    }, 1000);
  }

  function resumen() {
    const nombres = l => l.map(id => id ? APP.champMap[id].name : "—").join(", ");
    return `La Grieta · Draft\n${t("d.blue")}: ${nombres(st.B.pick)}\n  Bans: ${nombres(st.B.ban)}\n${t("d.red")}: ${nombres(st.R.pick)}\n  Bans: ${nombres(st.R.ban)}\nlagrieta.eu/#/draft`;
  }

  // El temporizador solo corre con la sección visible
  document.addEventListener("vista", e => { visible = e.detail === "draft"; if (visible) arranca(); else clearInterval(timer); });
  document.addEventListener("datos", () => { if (!st) st = nuevo(); estructura(); arranca(); });
  document.addEventListener("errorDatos", () => errorEn(box));
})();
