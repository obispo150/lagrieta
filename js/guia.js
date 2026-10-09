/* =========================================================
   guia.js — roles
   ========================================================= */
"use strict";

const roles = [
  { ico:"🛡️", name:"Top", short:"Luchadores y tanques que aguantan solos en el carril superior.",
    long:"El top es una isla: pasas mucho tiempo en 1 contra 1. Necesitas saber gestionar las oleadas y aprovechar el Teleport para ayudar al equipo.",
    tips:["Controla bien las oleadas de súbditos","Vigila al jungla enemigo","Usa el Teleport en las peleas importantes"] },
  { ico:"🌲", name:"Jungla", short:"Recorre el mapa, controla objetivos y ayuda a los carriles.",
    long:"El jungla no tiene carril: farmea monstruos neutrales y decide dónde aparece. Es el rol que más influye en el ritmo de la partida.",
    tips:["Planifica tu ruta de campamentos","Prioriza dragones y objetivos","Gankea los carriles con ventaja"] },
  { ico:"⚡", name:"Mid", short:"Magos y asesinos en el carril central, el corazón del mapa.",
    long:"Desde el centro puedes moverte rápido a cualquier parte del mapa. Los mid suelen ser los que más daño explosivo hacen.",
    tips:["Empuja y rota a otros carriles","Coordínate con tu jungla","Avisa cuando tu rival desaparezca"] },
  { ico:"🏹", name:"ADC", short:"Tiradores que hacen daño constante a distancia.",
    long:"El ADC es frágil al principio pero se convierte en la mayor fuente de daño del equipo cuando tiene objetos.",
    tips:["Farmea todo lo que puedas","Posiciónate siempre detrás","En peleas, pega a lo que tengas más cerca"] },
  { ico:"💫", name:"Support", short:"Protegen al equipo, dan visión e inician peleas.",
    long:"El support acompaña al ADC en bot. No necesita oro para ser útil: su trabajo es la visión, el control y salvar a sus compañeros.",
    tips:["Pon centinelas constantemente","Protege a tu ADC","Rota al mid cuando tengas ocasión"] }
];

(() => {
  const rc = $("roleCards"), rd = $("roleDetail");
  roles.forEach(r => {
    const el = document.createElement("div");
    el.className = "role"; el.tabIndex = 0;
    el.innerHTML = `<div class="ico">${r.ico}</div><h3>${r.name}</h3><p>${r.short}</p>`;
    const abrir = () => {
      const estaba = el.classList.contains("active");
      rc.querySelectorAll(".role").forEach(x => x.classList.remove("active"));
      if (estaba) { rd.classList.remove("show"); return; }
      el.classList.add("active");
      rd.innerHTML = `<h3>${r.ico} ${r.name}</h3><p>${r.long}</p><ul>${r.tips.map(t => `<li>${t}</li>`).join("")}</ul>`;
      rd.classList.remove("show"); void rd.offsetWidth; rd.classList.add("show");
    };
    el.onclick = abrir;
    el.onkeydown = e => { if (e.key === "Enter") abrir(); };
    rc.appendChild(el);
  });
})();
