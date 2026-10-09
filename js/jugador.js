/* =========================================================
   jugador.js — buscador de jugadores (necesita el servidor Node)
   La clave de la API de Riot NUNCA va en el navegador:
   el navegador llama a nuestro servidor y el servidor a Riot.
   ========================================================= */
"use strict";

(() => {
  // Si la página la sirve el propio servidor, usamos la misma dirección; si se abre como archivo, localhost:3000
  const API = location.protocol.startsWith("http") && !location.hostname.endsWith("github.io") ? "" : "http://localhost:3000";
  const out = $("playerOut"), form = $("playerForm");

  const colas = { 420:"Clasificatoria Solo/Dúo", 440:"Clasificatoria Flexible", 400:"Normal (reclutamiento)", 430:"Normal", 490:"Partida rápida",
    450:"ARAM", 1700:"Arena", 1900:"URF", 900:"ARURF", 1020:"Uno para todos", 830:"Coop vs IA", 840:"Coop vs IA", 850:"Coop vs IA" };
  const tiers = { IRON:"Hierro", BRONZE:"Bronce", SILVER:"Plata", GOLD:"Oro", PLATINUM:"Platino", EMERALD:"Esmeralda",
    DIAMOND:"Diamante", MASTER:"Maestro", GRANDMASTER:"Gran Maestro", CHALLENGER:"Challenger" };
  const tierColor = { IRON:"#7d6b61", BRONZE:"#a5664a", SILVER:"#9aa4af", GOLD:"#d6a84b", PLATINUM:"#3fb5a6", EMERALD:"#2fae6a",
    DIAMOND:"#6c8cf5", MASTER:"#b45cd6", GRANDMASTER:"#e0464e", CHALLENGER:"#f4c874" };

  const ultimo = store.get("ultimoJugador", null);
  if (ultimo) { $("riotId").value = ultimo.id; $("region").value = ultimo.region; }

  out.innerHTML = `<div class="notice">Esta función usa la API oficial de Riot a través del servidor del proyecto
    (<code>server/</code>). Arráncalo con <code>npm start</code> y abre <code>http://localhost:3000</code>.</div>`;

  form.onsubmit = async e => {
    e.preventDefault();
    const raw = $("riotId").value.trim(), region = $("region").value;
    const [nombre, tag] = raw.split("#").map(s => s?.trim());
    if (!nombre || !tag) { toast("Escribe el Riot ID completo: Nombre#TAG"); return; }
    store.set("ultimoJugador", { id: raw, region });
    out.innerHTML = `<div class="skel" style="height:130px;margin-bottom:14px"></div><div class="skel" style="height:300px"></div>`;
    try {
      const r = await fetch(`${API}/api/jugador?nombre=${encodeURIComponent(nombre)}&tag=${encodeURIComponent(tag)}&region=${region}`);
      const d = await r.json().catch(() => ({}));
      if (r.status === 404 && !d.error) throw new Error("El buscador de jugadores no está disponible en esta versión de la web.");
      if (!r.ok) throw new Error(d.error || "Error " + r.status);
      pinta(d);
    } catch (err) {
      const sinServidor = err instanceof TypeError;   // fetch falla con TypeError si no hay servidor
      out.innerHTML = `<div class="notice">${sinServidor
        ? `No se ha podido conectar con el servidor. Arráncalo con <code>cd server && npm start</code> y abre <code>http://localhost:3000</code>.`
        : esc(err.message)}</div>`;
    }
  };

  function campeonPorNombre(n) {
    // La API de partidas a veces usa otro formato de nombre (p. ej. "FiddleSticks")
    return APP.champMap[n] || APP.champs.find(c => c.id.toLowerCase() === String(n).toLowerCase());
  }

  function pinta(d) {
    const ver = APP.ver || "latest";
    const iconUrl = APP.ver ? img.icon(d.invocador.icono) : "";
    const ligas = d.ligas.length ? d.ligas.map(l => {
      const wr = Math.round(l.wins / Math.max(1, l.wins + l.losses) * 100);
      return `<div class="league"><small>${colas[l.queueType === "RANKED_SOLO_5x5" ? 420 : 440]}</small>
        <b style="color:${tierColor[l.tier] || "var(--gold)"}">${tiers[l.tier] || l.tier} ${["MASTER","GRANDMASTER","CHALLENGER"].includes(l.tier) ? "" : l.rank}</b>
        <span>${l.lp} LP · ${l.wins}V ${l.losses}D · <span class="${wr >= 50 ? "ok-t" : "ko-t"}">${wr}%</span></span></div>`;
    }).join("") : `<div class="league"><small>Clasificatoria</small><b>Sin clasificar</b></div>`;

    const partidas = d.partidas.length ? d.partidas.map(m => {
      const c = campeonPorNombre(m.campeon);
      const kda = m.d ? ((m.k + m.a) / m.d).toFixed(2) : "Perfecto";
      const mins = Math.max(1, m.duracion / 60);
      const fecha = new Date(m.fecha).toLocaleDateString("es-ES", { day:"numeric", month:"short" });
      return `<div class="match${m.gano ? " win" : ""}">
        <div class="side"></div>
        ${c ? `<img src="${img.champ(c)}" alt="${esc(c.name)}" title="${esc(c.name)}" style="cursor:pointer" data-c="${c.id}">` : `<img alt="">`}
        <div><span class="${m.gano ? "ok-t" : "ko-t"}">${m.gano ? "Victoria" : "Derrota"}</span> · ${colas[m.cola] || esc(m.modo)}
          <div class="kda">${m.k} / ${m.d} / ${m.a} <small style="display:inline">· KDA ${kda}</small></div>
          <small>${m.cs} CS (${(m.cs / mins).toFixed(1)}/min) · ${Math.floor(m.duracion / 60)}:${String(m.duracion % 60).padStart(2, "0")} · ${fecha}</small></div>
        <div class="its">${m.items.map(id => id ? `<img src="${DD}/cdn/${ver}/img/item/${id}.png" alt="" title="${esc(APP.items[id]?.name || "")}">` : `<i></i>`).join("")}</div>
      </div>`;
    }).join("") : `<p class="muted">No hay partidas recientes.</p>`;

    out.innerHTML = `
      <div class="pcard"><div class="ic"><img src="${iconUrl}" alt=""><span>${d.invocador.nivel}</span></div>
        <div><h3>${esc(d.cuenta.gameName)} <small>#${esc(d.cuenta.tagLine)}</small></h3>
        <span class="muted">${d.partidas.length} partidas recientes · ${d.partidas.filter(m => m.gano).length} victorias</span></div></div>
      <div class="leagues">${ligas}</div>
      <h3 style="margin:10px 0 12px">Últimas partidas</h3>
      <div class="matches">${partidas}</div>`;
    out.querySelectorAll("[data-c]").forEach(el => el.onclick = () => abrirCampeon(el.dataset.c));
  }
})();
