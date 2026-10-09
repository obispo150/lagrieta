/* =========================================================
   ads.js — anuncios de Google AdSense
   ---------------------------------------------------------
   Mientras CLIENTE esté vacío no se carga nada y los huecos
   de anuncio no se ven. Cuando Google te apruebe:
     1. Pon tu ID de editor en CLIENTE (ca-pub-XXXXXXXXXXXXXXXX)
     2. (Opcional) Crea bloques de anuncio en AdSense y pega sus
        IDs en BLOQUES. Si los dejas vacíos, solo funcionarán
        los "anuncios automáticos" que actives en AdSense.
   ========================================================= */
"use strict";

const ADSENSE = {
  CLIENTE: "",                 // p. ej. "ca-pub-1234567890123456"
  BLOQUES: {
    "tras-campeones": "",      // p. ej. "1234567890"
    "tras-runas": "",
    "tras-juegos": "",
    "articulo": "",            // dentro de las guías
    "final": ""
  }
};

(() => {
  const huecos = document.querySelectorAll(".ad-slot");
  if (!ADSENSE.CLIENTE) { huecos.forEach(h => h.remove()); return; }

  // Script oficial de AdSense
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.CLIENTE}`;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);

  // Bloques manuales
  huecos.forEach(h => {
    const id = ADSENSE.BLOQUES[h.dataset.hueco];
    if (!id) { h.remove(); return; }
    h.innerHTML = `<span class="ad-label">Publicidad</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE.CLIENTE}" data-ad-slot="${id}"
           data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
})();

// Botón "Configurar cookies": reabre el banner de consentimiento de Google (Privacidad y mensajes)
document.querySelectorAll("[data-cookies]").forEach(b => b.addEventListener("click", e => {
  e.preventDefault();
  if (window.googlefc?.callbackQueue) window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);
  else alert("El panel de cookies estará disponible cuando los anuncios estén activos. Ahora mismo la web no usa cookies de publicidad.");
}));
