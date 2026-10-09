/* =========================================================
   guia.js — sección "Aprende": roles, línea de tiempo y glosario
   ========================================================= */
"use strict";

(() => {
  const ROLES = [["top", "shield"], ["jungle", "leaf"], ["mid", "bolt"], ["adc", "crosshair"], ["support", "plusShield"]];
  const rc = $("roleCards"), rd = $("roleDetail");
  let activo = null;

  function pintaRoles() {
    rc.innerHTML = ROLES.map(([k, ic]) => `
      <button class="role${activo === k ? " on" : ""}" type="button" data-r="${k}">
        ${icon(ic)}<h3>${t("role." + k)}</h3><p>${t("role." + k + "S")}</p>
      </button>`).join("");
    detalle();
  }
  function detalle() {
    if (!activo) { rd.classList.remove("on"); return; }
    const ic = ROLES.find(r => r[0] === activo)[1];
    rd.innerHTML = `<h3>${t("role." + activo)}</h3><p>${t("role." + activo + "L")}</p>
      <ul>${t("role." + activo + "T").split("|").map(x => `<li>${x}</li>`).join("")}</ul>`;
    rd.classList.add("on");
  }
  rc.addEventListener("click", e => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    activo = activo === b.dataset.r ? null : b.dataset.r;
    rc.querySelectorAll(".role").forEach(x => x.classList.toggle("on", x.dataset.r === activo));
    detalle();
  });

  function pintaTimeline() {
    $("timeline").innerHTML = [1, 2, 3, 4, 5, 6].map(n => {
      const [a, b] = t("esp." + n).split("|");
      return `<li><b>${a}</b><p>${b}</p></li>`;
    }).join("");
  }
  function pintaGlosario() {
    $("gloss").innerHTML = t("gl.list").split(";;").map(e => {
      const [a, b] = e.split("|");
      return `<details><summary>${a}${icon("chevDown")}</summary><p>${b}</p></details>`;
    }).join("");
  }

  const todo = () => { pintaRoles(); pintaTimeline(); pintaGlosario(); };
  todo();
  document.addEventListener("idioma", todo);
})();
