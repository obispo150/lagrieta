/* =========================================================
   juegos.js — Adivina el campeón, Draft simulator y Quiz
   ========================================================= */
"use strict";

/* ============ ADIVINA EL CAMPEÓN ============ */
(() => {
  const box = $("guessBox"), modesEl = $("guessModes");
  const MODOS = [["imagen", "🖼 Imagen"], ["habilidad", "✨ Habilidad"], ["titulo", "📜 Título"]];
  const MAX = 5;
  let modo = "imagen", ronda = null;
  let racha = 0, mejor = store.get("adivinaMejor", 0);
  const ZOOM = [700, 480, 320, 200, 130, 100];   // el zoom de la imagen baja con cada fallo

  MODOS.forEach(([id, t]) => {
    const b = document.createElement("button"); b.textContent = t; if (id === modo) b.className = "on";
    b.onclick = () => { modo = id; modesEl.querySelectorAll("button").forEach(x => x.classList.remove("on")); b.classList.add("on"); nueva(); };
    modesEl.appendChild(b);
  });

  async function nueva() {
    if (!APP.listo) return;
    const c = azar(APP.champs);
    ronda = { c, fallos: [], fin: false, pos: `${Math.floor(Math.random() * 80) + 10}% ${Math.floor(Math.random() * 60) + 10}%` };
    if (modo === "habilidad") {
      box.innerHTML = `<p class="muted">Cargando...</p>`;
      try {
        const f = await champFull(c.id);
        const habs = [{ k:"Pasiva", name:f.passive.name, img:img.passive(f.passive.image.full) },
          ...f.spells.map((s, i) => ({ k:"QWER"[i], name:s.name, img:img.spell(s.image.full) }))];
        ronda.hab = azar(habs);
      } catch (e) { box.innerHTML = `<div class="err">No se pudo cargar la ronda.<br><button class="btn sm" id="gRetry">Reintentar</button></div>`; $("gRetry").onclick = nueva; return; }
    }
    pinta();
  }

  function pistas() {
    const c = ronda.c, n = ronda.fallos.length, p = [];
    if (modo === "habilidad") {
      if (n >= 1) p.push(`Tecla: <b>${ronda.hab.k}</b>`);
      if (n >= 2) p.push(`Clase: <b>${c.tags.map(t => clases[t] || t).join(", ")}</b>`);
      if (n >= 3) p.push(`Habilidad: <b>${esc(ronda.hab.name)}</b>`);
      if (n >= 4) p.push(`Empieza por: <b>${esc(c.name[0])}</b>`);
    } else if (modo === "titulo") {
      if (n >= 1) p.push(`Clase: <b>${c.tags.map(t => clases[t] || t).join(", ")}</b>`);
      if (n >= 2) p.push(`Recurso: <b>${recursos[c.partype] ?? c.partype}</b>`);
      if (n >= 3) p.push(`Dificultad: <b>${c.info.difficulty}/10</b>`);
      if (n >= 4) p.push(`Empieza por: <b>${esc(c.name[0])}</b>`);
    } else {
      if (n >= 2) p.push(`Clase: <b>${c.tags.map(t => clases[t] || t).join(", ")}</b>`);
      if (n >= 4) p.push(`Empieza por: <b>${esc(c.name[0])}</b>`);
    }
    return p.length ? `<div class="hints">${p.map(x => `<span>💡 ${x}</span>`).join("")}</div>` : "";
  }

  function pinta() {
    const c = ronda.c, fin = ronda.fin;
    const zoom = fin ? 100 : ZOOM[Math.min(ronda.fallos.length, ZOOM.length - 1)];
    const pista = modo === "imagen"
      ? `<div class="guess-pic" style="background-image:url('${img.splash(c.id)}');background-size:${zoom * 1.78}% ${zoom}%;background-position:${fin ? "center 20%" : ronda.pos}"></div>`
      : modo === "habilidad"
      ? `<img class="guess-ab" src="${ronda.hab.img}" alt="Habilidad misteriosa">`
      : `<div class="muted">¿Qué campeón es…</div><div class="guess-title">${esc(c.title)}</div>`;

    box.innerHTML = `
      <div class="guess-score"><span>Racha <b>${racha}</b></span><span>Mejor racha <b>${mejor}</b></span><span>Intentos <b>${MAX - ronda.fallos.length}</b></span></div>
      ${pista}
      ${fin ? "" : pistas()}
      ${fin ? `<div class="guess-res">
          <img src="${img.champ(c)}" alt="">
          <div class="${ronda.ok ? "ok-t" : "ko-t"}">${ronda.ok ? "¡Correcto!" : "¡Se acabaron los intentos!"}</div>
          <p>Era <b>${esc(c.name)}</b>, ${esc(c.title)}</p>
          <div class="mactions" style="justify-content:center;margin-top:14px">
            <button class="btn sm" id="gNext">Siguiente</button>
            <button class="btn sm" id="gInfo">Ver ficha</button></div></div>`
      : `<form id="gForm"><input id="gInput" list="gList" placeholder="Escribe un campeón..." autocomplete="off">
          <button class="btn sm" type="submit">Probar</button>
          <button class="btn sm" type="button" id="gSkip">Rendirse</button></form>
        <datalist id="gList">${APP.champs.map(x => `<option value="${esc(x.name)}">`).join("")}</datalist>`}
      ${ronda.fallos.length ? `<div class="tries">${ronda.fallos.map(f => `<span>${esc(f)}</span>`).join("")}</div>` : ""}`;

    if (fin) {
      $("gNext").onclick = nueva; $("gInfo").onclick = () => abrirCampeon(c.id);
      $("gNext").focus({ preventScroll: true });
      return;
    }
    const inp = $("gInput");
    $("gForm").onsubmit = e => {
      e.preventDefault();
      const g = buscaCampeon(inp.value);
      if (!g) { toast("Ese campeón no existe"); return; }
      if (ronda.fallos.includes(g.name)) { toast("Ya lo has probado"); return; }
      if (g.id === c.id) { ronda.ok = true; ronda.fin = true; racha++; if (racha > mejor) { mejor = racha; store.set("adivinaMejor", mejor); } }
      else { ronda.fallos.push(g.name); if (ronda.fallos.length >= MAX) { ronda.fin = true; racha = 0; } }
      pinta();
      if (!ronda.fin) $("gInput").focus({ preventScroll: true });
    };
    $("gSkip").onclick = () => { ronda.fin = true; racha = 0; pinta(); };
  }

  document.addEventListener("datos", nueva);
  document.addEventListener("cargando", () => box.innerHTML = `<p class="muted">Cargando...</p>`);
  document.addEventListener("errorDatos", () => errorEn(box));
})();

/* ============ DRAFT SIMULATOR ============ */
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
  let st, timer = null, conTiempo = true, filtroTxt = "", visible = false;

  function reset() {
    clearInterval(timer);
    st = { paso: 0, sel: null, t: TIEMPO, B: { ban: [], pick: [] }, R: { ban: [], pick: [] } };
    construye(); arrancaTimer();
  }
  const usados = () => new Set([...st.B.ban, ...st.R.ban, ...st.B.pick, ...st.R.pick].filter(Boolean));

  function construye() {
    box.innerHTML = `
      <div class="draft-wrap">
        <div class="team blue"><h3>Equipo azul</h3><div class="picks" id="dpB"></div><div class="bans" id="dbB"></div></div>
        <div class="draft-center">
          <div class="turn" id="dTurn"></div>
          <div class="draft-tools">
            <input class="search" id="dSearch" type="search" placeholder="Buscar..." value="${esc(filtroTxt)}">
            <button class="btn sm" id="dOk" disabled>Confirmar</button>
            <button class="btn sm" id="dRand">🎲</button>
            <label><input type="checkbox" id="dTime" ${conTiempo ? "checked" : ""}> Tiempo</label>
            <button class="btn sm" id="dReset">Reiniciar</button>
          </div>
          <div class="dgrid" id="dGrid"></div>
        </div>
        <div class="team red"><h3>Equipo rojo</h3><div class="picks" id="dpR"></div><div class="bans" id="dbR"></div></div>
      </div>`;
    $("dSearch").oninput = e => { filtroTxt = e.target.value; rejilla(); };
    $("dOk").onclick = confirmar;
    $("dRand").onclick = () => { const l = libres(); if (l.length) { st.sel = azar(l).id; rejilla(); $("dOk").disabled = false; } };
    $("dTime").onchange = e => { conTiempo = e.target.checked; st.t = TIEMPO; arrancaTimer(); turno(); };
    $("dReset").onclick = reset;
    $("dGrid").onclick = e => {
      const b = e.target.closest("[data-d]"); if (!b || b.disabled || st.paso >= ORDEN.length) return;
      st.sel = b.dataset.d; rejilla(); $("dOk").disabled = false;
    };
    $("dGrid").ondblclick = e => { if (e.target.closest("[data-d]:not(:disabled)")) confirmar(); };
    equipos(); rejilla(); turno();
  }

  const libres = () => { const u = usados(); return APP.champs.filter(c => !u.has(c.id)); };

  function rejilla() {
    const u = usados(), q = norm(filtroTxt);
    $("dGrid").innerHTML = APP.champs.filter(c => norm(c.name).includes(q)).map(c =>
      `<button class="dch${st.sel === c.id ? " sel" : ""}" data-d="${c.id}" title="${esc(c.name)}" ${u.has(c.id) || st.paso >= ORDEN.length ? "disabled" : ""}>
        <img loading="lazy" src="${img.champ(c)}" alt="${esc(c.name)}"></button>`).join("");
  }

  function equipos() {
    const act = ORDEN[st.paso];
    for (const eq of ["B", "R"]) {
      // Posición del siguiente hueco libre para marcarlo como activo
      $("dp" + eq).innerHTML = Array.from({ length: 5 }, (_, i) => {
        const id = st[eq].pick[i], c = id && APP.champMap[id];
        const esAct = act && act[0] === eq && act[1] === "pick" && i === st[eq].pick.length;
        const prev = esAct && st.sel ? APP.champMap[st.sel] : null;
        const fondo = c ? img.splash(c.id) : prev ? img.splash(prev.id) : "";
        return `<div class="pick${esAct ? " act" : ""}" style="${fondo ? `background-image:url('${fondo}')` : ""}${prev ? ";opacity:.6" : ""}">${c ? esc(c.name) : prev ? esc(prev.name) : ""}</div>`;
      }).join("");
      $("db" + eq).innerHTML = Array.from({ length: 5 }, (_, i) => {
        const id = st[eq].ban[i], hecho = i < st[eq].ban.length;
        const esAct = act && act[0] === eq && act[1] === "ban" && i === st[eq].ban.length;
        const c = id && APP.champMap[id];
        return `<div class="ban${hecho ? " full" : ""}${esAct ? " act" : ""}" title="${c ? esc(c.name) : hecho ? "Sin ban" : ""}" style="${c ? `background-image:url('${img.champ(c)}')` : ""}"></div>`;
      }).join("");
    }
  }

  function turno() {
    const t = $("dTurn"); if (!t) return;
    if (st.paso >= ORDEN.length) {
      t.innerHTML = `<b style="color:var(--gold)">¡Draft completado!</b>`;
      $("dOk").disabled = true;
      return;
    }
    const [eq, tipo] = ORDEN[st.paso];
    const fase = st.paso < 6 ? "Fase de bans 1" : st.paso < 12 ? "Fase de picks 1" : st.paso < 16 ? "Fase de bans 2" : "Fase de picks 2";
    t.innerHTML = `<div class="muted" style="font-size:.8rem">${fase} · Turno ${st.paso + 1}/20</div>
      <b style="color:var(--team-${eq === "B" ? "blue" : "red"})">${eq === "B" ? "Azul" : "Rojo"}: ${tipo === "ban" ? "bloquea" : "elige"} un campeón</b>
      ${conTiempo ? `<span class="timer" id="dTimer">${st.t}s</span>` : ""}`;
  }

  function confirmar() {
    if (st.paso >= ORDEN.length) return;
    const [eq, tipo] = ORDEN[st.paso];
    if (!st.sel && tipo === "pick") return;
    st[eq][tipo].push(st.sel);   // un ban sin selección queda vacío (null)
    st.sel = null; st.paso++; st.t = TIEMPO;
    equipos(); rejilla(); turno();
    $("dOk").disabled = true;
    if (st.paso >= ORDEN.length) clearInterval(timer);
  }

  function arrancaTimer() {
    clearInterval(timer);
    if (!conTiempo || !visible || st.paso >= ORDEN.length) return;
    timer = setInterval(() => {
      if (st.paso >= ORDEN.length) return clearInterval(timer);
      st.t--;
      const el = $("dTimer"); if (el) el.textContent = st.t + "s";
      if (st.t <= 0) {
        // Se acabó el tiempo: un pick se elige al azar y un ban se pierde
        if (!st.sel && ORDEN[st.paso][1] === "pick") st.sel = azar(libres()).id;
        confirmar();
      }
    }, 1000);
  }

  // El temporizador solo corre cuando la sección se ve en pantalla
  const vis = new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    if (!st) return;
    if (visible) arrancaTimer(); else clearInterval(timer);
  }));
  vis.observe(box);

  // Con cambio de idioma solo hay que repintar; con la primera carga se crea el draft
  document.addEventListener("datos", () => { if (!st) { reset(); } else { equipos(); rejilla(); } });
  document.addEventListener("errorDatos", () => errorEn(box));
})();

/* ============ QUIZ ============ */
(() => {
  const box = $("quizBox"), modesEl = $("quizModes");
  const basicas = [
    { q:"¿Cuántos jugadores hay en cada equipo en la Grieta del Invocador?", o:["3","4","5","6"], a:2 },
    { q:"¿Qué hay que destruir para ganar la partida?", o:["El Barón","El Nexo","Todas las torres","El Dragón Ancestral"], a:1 },
    { q:"¿Qué rol suele ir con el ADC en el carril inferior?", o:["Jungla","Mid","Top","Support"], a:3 },
    { q:"¿Cuál es el nivel máximo de un campeón en una partida normal?", o:["16","18","20","30"], a:1 },
    { q:"¿Qué empresa desarrolla League of Legends?", o:["Blizzard","Valve","Riot Games","Epic Games"], a:2 },
    { q:"¿Qué consigues al matar cuatro dragones?", o:["El Alma del Dragón","Un Nexo extra","Oro infinito","Nada"], a:0 }
  ];
  const rangos = ["Hierro","Bronce","Plata","Oro","Platino","Esmeralda","Diamante","Maestro","Gran Maestro","Challenger"];
  let modo = "basico", idx = 0, aciertos = 0, vidas = 3, mejor = store.get("quizMejor", 0);

  [["basico", "Básico (6 preguntas)"], ["infinito", "♾ Infinito"]].forEach(([id, t]) => {
    const b = document.createElement("button"); b.textContent = t; if (id === modo) b.className = "on";
    b.onclick = () => { modo = id; modesEl.querySelectorAll("button").forEach(x => x.classList.remove("on")); b.classList.add("on"); empezar(); };
    modesEl.appendChild(b);
  });

  function empezar() { idx = 0; aciertos = 0; vidas = 3; siguiente(); }

  // Genera una pregunta con 4 opciones a partir de los datos reales
  async function generar() {
    const otros = (c, n = 3) => mezcla(APP.champs.filter(x => x.id !== c.id)).slice(0, n);
    const tipos = ["titulo", "habilidad", "splash", "clase", "objeto", "precio"];
    const tipo = azar(tipos);
    const c = azar(APP.champs);
    if (tipo === "titulo") {
      const ops = mezcla([c, ...otros(c)]);
      return { q:`¿Qué campeón es «${c.title}»?`, o:ops.map(x => x.name), a:ops.indexOf(c) };
    }
    if (tipo === "habilidad") {
      const f = await champFull(c.id);
      const i = Math.floor(Math.random() * 5);
      const h = i === 0 ? { n:f.passive.name, img:img.passive(f.passive.image.full), k:"pasiva" } : { n:f.spells[i - 1].name, img:img.spell(f.spells[i - 1].image.full), k:"QWER"[i - 1] };
      const ops = mezcla([c, ...otros(c)]);
      return { q:`¿De quién es esta habilidad (${h.k})?`, img:h.img, o:ops.map(x => x.name), a:ops.indexOf(c), extra:h.n };
    }
    if (tipo === "splash") {
      const ops = mezcla([c, ...otros(c)]);
      return { q:"¿Quién aparece en esta imagen?", splash:img.splash(c.id), o:ops.map(x => x.name), a:ops.indexOf(c) };
    }
    if (tipo === "clase") {
      const ok = clases[c.tags[0]] || c.tags[0];
      const ops = mezcla([ok, ...mezcla(Object.values(clases).filter(x => !c.tags.map(t => clases[t]).includes(x))).slice(0, 3)]);
      return { q:`¿Cuál es la clase principal de ${c.name}?`, o:ops, a:ops.indexOf(ok) };
    }
    const legend = APP.itemList.filter(it => tipoObjeto(it) === "legendario");
    const it = azar(legend);
    if (tipo === "objeto") {
      const ops = mezcla([it, ...mezcla(legend.filter(x => x.id !== it.id)).slice(0, 3)]);
      return { q:"¿Cómo se llama este objeto?", img:img.item(it.id), o:ops.map(x => x.name), a:ops.indexOf(it) };
    }
    const p = precio(it);
    const ops = mezcla([p, ...mezcla([-600, -400, -200, 200, 400, 600]).slice(0, 3).map(d => p + d)]);
    return { q:`¿Cuánto cuesta ${it.name}?`, img:img.item(it.id), o:ops.map(x => fmt(x) + " de oro"), a:ops.indexOf(p) };
  }

  async function siguiente() {
    let p;
    if (modo === "basico") p = basicas[idx];
    else {
      if (!APP.listo) { box.innerHTML = `<p class="muted">Cargando datos...</p>`; return; }
      box.innerHTML = `<p class="muted">Generando pregunta...</p>`;
      try { p = await generar(); } catch (e) { p = basicas[Math.floor(Math.random() * basicas.length)]; }
    }
    const cab = modo === "basico"
      ? `<span>PREGUNTA ${idx + 1} / ${basicas.length}</span><span>Aciertos: ${aciertos}</span>`
      : `<span>PUNTOS: ${aciertos} · RÉCORD: ${mejor}</span><span>${"❤️".repeat(vidas)}${"🖤".repeat(3 - vidas)}</span>`;
    box.innerHTML = `<div class="prog">${cab}</div>
      ${p.img ? `<img class="qimg" src="${p.img}" alt="">` : ""}
      ${p.splash ? `<img class="qsplash" src="${p.splash}" alt="">` : ""}
      <div class="q">${esc(p.q)}</div>
      <div class="opts">${p.o.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join("")}</div>
      ${p.extra ? `<p class="muted" id="qExtra" style="display:none;margin-top:12px">Habilidad: <b>${esc(p.extra)}</b></p>` : ""}
      <button class="btn next" id="qNext">Siguiente</button>`;
    box.querySelectorAll(".opts button").forEach(b => b.onclick = () => {
      const i = +b.dataset.i, ok = i === p.a;
      box.querySelectorAll(".opts button").forEach(x => { x.disabled = true; if (+x.dataset.i === p.a) x.classList.add("ok"); });
      if (ok) aciertos++; else { b.classList.add("ko"); vidas--; }
      const sp = box.querySelector(".qsplash"); if (sp) sp.style.filter = "none";
      const ex = $("qExtra"); if (ex) ex.style.display = "block";
      const fin = modo === "basico" ? idx >= basicas.length - 1 : vidas <= 0;
      const nb = $("qNext"); nb.textContent = fin ? "Ver resultado" : "Siguiente"; nb.style.display = "inline-block";
      nb.onclick = () => { idx++; fin ? resultado() : siguiente(); };
    });
  }

  function resultado() {
    let r, extra;
    if (modo === "basico") { r = rangos[Math.round(aciertos / basicas.length * (rangos.length - 1))]; extra = `Has acertado ${aciertos} de ${basicas.length}`; }
    else {
      if (aciertos > mejor) { mejor = aciertos; store.set("quizMejor", mejor); }
      r = rangos[Math.min(rangos.length - 1, Math.floor(aciertos / 3))];
      extra = `${aciertos} respuestas correctas · Récord: ${mejor}`;
    }
    box.innerHTML = `<div class="result"><p>Tu rango es</p><b>${r}</b>
      <p class="muted" style="margin:10px 0 20px">${extra}</p><button class="btn" id="qAgain">Repetir</button></div>`;
    $("qAgain").onclick = empezar;
  }

  empezar();
})();
