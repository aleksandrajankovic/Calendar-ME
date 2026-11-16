// src/lib/market.js
// Sve što je specifično za ME market (domen, vremenska zona, ijekavski tekstovi).
// Ostatak koda je identičan RS kalendaru — pri sinhronizaciji sa RS-om ovaj fajl se ne dira,
// samo se ponovo primene importi iz njega (vidi grep "@/lib/market").

export const BASE_URL = "https://calendar.meridianbet.me";
// Kuda vodi klik na logo
export const MAIN_SITE_URL = "https://meridianbet.me";
// Dugme na poruci "kalendar zatvoren" (podrazumevano — može da se promeni u adminu)
export const ALL_PROMOS_URL = "https://meridianbet.me/promo/sr";

export const HTML_LANG = "sr-Latn-ME";
export const OG_LOCALE = "sr_ME";
export const NUMBER_LOCALE = "sr-Latn-ME";
// "Danas", zaključavanje budućih dana i analitika računaju se po ovoj zoni
export const TIME_ZONE = "Europe/Podgorica";

// Grebalica — ljubičasta kartica + kursor-novčić (globals.css, #scratch-canvas)
export const SCRATCH_COVER = "/img/scratchCard.png";

export const UI = {
  calendarClosedAdmin: "⚠ Kalendar zatvoren — posjetioci vide samo poruku",
  monthInactive: "⚠ Mjesec deaktiviran — nije vidljiv korisnicima",
};
