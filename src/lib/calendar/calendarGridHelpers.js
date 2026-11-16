// src/lib/calendarGridHelpers.js
import { buildPromoUrlISO, slugify } from "@/lib/calendar/slug";

import { TIME_ZONE } from "@/lib/market";
function firstImage(richHtml) {
  return richHtml?.match(/<img[^>]*src=["']([^"']+)["']/i)?.[1] || "";
}

function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.values(x);
  return [];
}

// specials → map po danu
function indexSpecialsForMonth(specials, year, month) {
  const map = new Map();
  for (const sp of asArray(specials)) {
    if (!sp?.active) continue;
    if (sp.year === year && sp.month === month) {
      map.set(sp.day, sp);
    }
  }
  return map;
}

function pickPromoForDate(date, weekly, specialsMap) {
  const sp = specialsMap.get(date.getDate());
  if (sp) return { promo: sp, type: "special" };

  let wd = date.getDay(); // 0..6 (Sun..Sat)
  if (wd === 0) wd = 7;   // Sun -> 7
  wd = wd - 1;            // 0..6 (Mon..Sun)

  const w = asArray(weekly)[wd];
  if (w && w.active) return { promo: w, type: "weekly" };

  return { promo: null, type: null };
}

export function buildCalendarData({
  year,
  month,
  weekly = [],
  specials = [],
  adminPreview = false,
  lang = "pt",
  today = new Date(),
  dayFrom = null,
  dayTo = null,
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 7 : firstDay; // 1..7 (Mon..Sun)

  const prevMonthDays = new Date(year, month, 0).getDate();
  const specialsMap = indexSpecialsForMonth(specials, year, month);

  const cells = [];
  const daysPayload = [];

  // Skraćen mesec (npr. kampanja 15–31): prikazuju se samo dani iz opsega, bez dana
  // susednih meseci. Svaki dan zadržava svoj pravi datum, pa otključavanje i dalje ide po datumu.
  const from = Math.max(1, Math.min(dayFrom || 1, daysInMonth));
  const to = Math.max(from, Math.min(dayTo || daysInMonth, daysInMonth));
  const isRange = from > 1 || to < daysInMonth;

  // LEADING – dani prethodnog meseca
  const leadingDays = isRange ? 0 : startDay - 1;
  for (let i = 0; i < leadingDays; i++) {
    const dayNum = prevMonthDays - leadingDays + 1 + i;
    cells.push({
      type: "prev",
      key: `prev-${dayNum}`,
      day: dayNum,
    });
  }

  // GLAVNI – dani tekućeg meseca
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const srbParts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(today);
    const srbY = parseInt(srbParts.find(p => p.type === "year").value);
    const srbM = parseInt(srbParts.find(p => p.type === "month").value) - 1;
    const srbD = parseInt(srbParts.find(p => p.type === "day").value);
    const todayDateOnly = new Date(srbY, srbM, srbD);
    const isFuture = d > todayDateOnly;
    const isToday = d.getTime() === todayDateOnly.getTime();

    const { promo, type } = pickPromoForDate(d, weekly, specialsMap);
    const icon =
      promo?.icon && String(promo.icon).trim() ? promo.icon : null;

    const shareUrl = promo
      ? buildPromoUrlISO(d, promo.title || slugify("promocao"))
      : null;

    const isFutureForUx = adminPreview ? false : isFuture && !isToday;
    const isLocked = adminPreview ? false : isFutureForUx;

    const category = promo?.category || "ALL";
    // slot ima prednost nad grebalicom (API ih ionako ne dozvoljava zajedno)
    const slot = !!promo?.slot;
    const scratch = !!promo?.scratch && !slot;
    const flipCard = !!promo?.flipCard && !slot;
    const knockoutPhase = promo?.knockoutPhase || null;

    // cell za grid (desktop) — samo dani iz opsega; payload (modal, deljeni linkovi) ostaje ceo mesec
    if (day >= from && day <= to) cells.push({
      type: "day",
      key: `day-${day}`,
      day,
      hasPromo: Boolean(promo),
      isToday,
      isFutureForUx,
      isLocked,
      icon,
      category,
      knockoutPhase,
      isSpecial: type === "special",
    });

    // payload za JS (modal + mobile)
    const title = promo?.title || "";
    const richHtml = promo?.richHtml || null;
    const link = promo?.link || "#";
    const button =
      promo?.button || (lang === "pt" ? "Saiba mais" : "Learn more");
    const buttonColor = promo?.buttonColor || "green";

    daysPayload.push({
      day,
      year,
      month,
      shareUrl,
      type,
      title,
      richHtml,
      link,
      button,
      buttonColor,
      category,
      scratch,
      slot,
      flipCard,
      knockoutPhase,

      hasPromo: Boolean(promo),
      isToday,
      isFutureForUx,
      isLocked,
      icon,

      promo: promo
        ? {
            title,
            richHtml,
            link,
            button,
            buttonColor,
            category,
            icon,
            scratch,
            slot,
            flipCard,
            knockoutPhase,
          }
        : null,
    });
  }

  // Slot vrti slike ostalih promocija meseca (prva slika iz opisa), pa na kraju staje na svoju
  const promoImages = [...new Set(daysPayload.map((d) => firstImage(d.richHtml)).filter(Boolean))];
  for (const d of daysPayload) {
    if (!d.slot) continue;
    const own = firstImage(d.richHtml);
    d.slotPool = promoImages.filter((src) => src !== own).slice(0, 12);
  }


  // TRAILING – dani sledećeg meseca da se popuni poslednji red
  const totalCells = cells.length;
  const remainder = totalCells % 7;
  if (isRange && remainder !== 0) {
    // skraćen mesec: nepotpun poslednji red se centrira praznim poljima ispred
    const pad = Math.floor((7 - remainder) / 2);
    const lastRowStart = totalCells - remainder;
    const blanks = Array.from({ length: pad }, (_, i) => ({ type: "blank", key: `blank-${i}` }));
    cells.splice(lastRowStart, 0, ...blanks);
  } else if (remainder !== 0) {
    const nextDays = 7 - remainder;
    for (let i = 1; i <= nextDays; i++) {
      cells.push({
        type: "next",
        key: `next-${i}`,
        day: i,
      });
    }
  }

  return { cells, daysPayload, dayFrom: from, dayTo: to };
}
