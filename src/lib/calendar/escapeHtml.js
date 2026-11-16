// src/lib/calendar/escapeHtml.js
// Popup promocije se pravi kao HTML string (innerHTML / SSR). Obični tekstovi iz admina
// (naslov, dugme, link, ikonica) moraju da se escape-uju, inače bi npr. naslov sa
// `<img onerror=…>` ili link sa `"` izvršio kod kod posetioca. Opis (richHtml) je već
// sanitizovan pri čuvanju (lib/sanitize.js) i ubacuje se kao HTML.
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => MAP[c]);
}
