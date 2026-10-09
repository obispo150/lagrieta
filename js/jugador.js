/* =========================================================
   jugador.js — buscador de jugadores
   La clave de Riot nunca está en el navegador: la web llama a
   nuestro servicio (Cloudflare Worker) y él llama a Riot.
   La dirección del servicio se configura en js/config.js
   ========================================================= */
"use strict";

(() => {
  const out = $("playerOut"), form = $("playerForm");
  const tierColor = { IRON: "#7d6b61", BRONZE: "#a5664a", SILVER: "#9aa4af", GOLD: "#d6a84b", PLATINUM: "#3fb5a6", EMERALD: "#2fae6a",
    DIAMOND: "#6c8cf5", MASTER: "#b45cd6", GRANDMASTER: "#e0464e", CHALLENGER: "#f4c874" };
  let ultimoResultado = null;

  const ultimo = store.get("ultimoJugador", null);
  if (ultimo) { $("riotId").value = ultimo.id; $("region").value = ultimo.region; }

  const aviso = (ic, txt) => `<div class="notice">${icon(ic)}<span>${txt}</span></div>`;
  function inicial() {
    if (ultimoResultado) return pinta(ultimoResultado);
    out.innerHTML = CONFIG.API_URL ? "" : aviso("clock", t("p.soon"));
  }
  inicial();
  document.addEventListener("idioma", inicial);
  document.addEventListener("datos", () => { if (ultimoResultado) pinta(ultimoResultado); });

  form.onsubmit = async e => {
    e.preventDefault();
    if (!CONFIG.API_URL) { out.innerHTML = aviso("clock", t("p.soon")); return; }
    const raw = $("riotId").value.trim(), region = $("region").value;
    const [nombre, tag] = raw.split("#").map(s => s?.trim());
    if (!nombre || !tag) { toast(t("p.needTag")); return; }
    store.set("ultimoJugador", { id: raw, region });
    out.innerHTML = `<div class="skel" style="height:120px;margin-bottom:12px"></div><div class="skel" style="height:280px"></div>`;
    try {
      const r = await fetch(`${CONFIG.API_URL.replace(/\/$/, "")}/jugador?nombre=${encodeURIComponent(nombre)}&tag=${encodeURIComponent(tag)}&region=${region}&lang=${LANG}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || t("p.offline"));
      ultimoResultado = d; pinta(d);
    } catch (err) {
      out.innerHTML = aviso("info", err instanceof TypeError ? t("p.offline") : esc(err.message));
    }
  };

  const campeon = n => APP.champMap[n] || APP.champs.find(c => c.id.toLowerCase() === String(n).toLowerCase());

  function pinta(d) {
    const ligas = d.ligas.length ? d.ligas.map(l => {
      const wr = Math.round(l.wins / Math.max(1, l.wins + l.losses) * 100);
      const alto = ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(l.tier);
      return `<div class="league"><small>${t(l.queueType === "RANKED_SOLO_5x5" ? "queue.420" : "queue.440")}</small>
        <b style="color:${tierColor[l.tier] || "var(--accent)"}">${t("tier." + l.tier)} ${alto ? "" : l.rank}</b>
        <span>${l.lp} LP · ${l.wins}W ${l.losses}L · <span class="${wr >= 50 ? "ok-t" : "ko-t"}">${wr}%</span></span></div>`;
    }).join("") : `<div class="league"><small>${t("p.ranked")}</small><b>${t("p.unranked")}</b></div>`;

    const partidas = d.partidas.length ? d.partidas.map(m => {
      const c = campeon(m.campeon);
      const kda = m.d ? ((m.k + m.a) / m.d).toFixed(2) : t("p.perfect");
      const mins = Math.max(1, m.duracion / 60);
      const fecha = new Date(m.fecha).toLocaleDateString(LANG === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "short" });
      const cola = TEXTOS[LANG]["queue." + m.cola] ? t("queue." + m.cola) : esc(m.modo);
      return `<div class="match${m.gano ? " win" : ""}"><div class="side"></div>
        ${c ? `<img src="${img.champ(c)}" alt="${esc(c.name)}" title="${esc(c.name)}" style="cursor:pointer" data-c="${c.id}">` : `<img alt="">`}
        <div><span class="${m.gano ? "ok-t" : "ko-t"}">${t(m.gano ? "p.win" : "p.loss")}</span> · ${cola}
          <div class="kda">${m.k} / ${m.d} / ${m.a} <small style="display:inline">· KDA ${kda}</small></div>
          <small>${m.cs} CS (${(m.cs / mins).toFixed(1)}/min) · ${Math.floor(m.duracion / 60)}:${String(m.duracion % 60).padStart(2, "0")} · ${fecha}</small></div>
        <div class="its">${m.items.map(id => id && APP.ver ? `<img src="${img.item(id)}" alt="" title="${esc(APP.items[id]?.name || "")}">` : `<i></i>`).join("")}</div>
      </div>`;
    }).join("") : `<p class="muted">${t("p.noGames")}</p>`;

    out.innerHTML = `
      <div class="pcard"><div class="ic">${APP.ver ? `<img src="${img.icon(d.invocador.icono)}" alt="">` : ""}<span>${d.invocador.nivel}</span></div>
        <div><h3>${esc(d.cuenta.gameName)} <small>#${esc(d.cuenta.tagLine)}</small></h3>
        <span class="muted">${t("p.games", { n: d.partidas.length, w: d.partidas.filter(m => m.gano).length })}</span></div></div>
      <div class="leagues">${ligas}</div>
      <div class="bhead"><h2>${t("p.recent")}</h2></div>
      <div class="matches">${partidas}</div>`;
    out.querySelectorAll("[data-c]").forEach(el => el.onclick = () => abrirCampeon(el.dataset.c));
  }
})();
