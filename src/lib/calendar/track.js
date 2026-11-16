// src/lib/calendar/track.js
// Analitika kalendara (klijent): šalje događaj na /api/track. sendBeacon stiže i kad
// klik na dugme odmah otvara drugu stranicu; greške se ignorišu — analitika nikad
// ne sme da pokvari kalendar. Admin pregled se ne broji.

let disabled = false;

export function disableTracking() {
  disabled = true;
}

export function track(type, data = {}) {
  if (disabled || typeof window === "undefined") return;

  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true; // pristup window.top iz tuđeg iframe-a baca grešku — znači da smo u iframe-u
  }

  const body = JSON.stringify({
    type,
    ...data,
    device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    embedded,
  });

  try {
    if (navigator.sendBeacon?.("/api/track", body)) return;
  } catch {}
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}
