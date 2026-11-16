// src/app/api/calendar-settings/route.js
export const runtime = "nodejs";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { sanitizeConfetti } from "@/lib/calendar/confetti";
import { sanitizeLink } from "@/lib/validate";

const VALID_POS = ["left", "center", "right"];
const VALID_THEMES = ["default", "default-horizontal", "football"];
const DEFAULT_SEO_META = {
  sr: { title: "Kalendar Promocija | Meridianbet", description: "Otkrijte dnevne promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija." },
};

export async function GET(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const row = await prisma.calendarSettings.findFirst();
  return Response.json({
    bgImageUrl:       row?.bgImageUrl       || "/img/bg-calendar.png",
    bgImageUrlMobile: row?.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
    monthBackgrounds: row?.monthBackgrounds || {},
    calendarPosition: row?.calendarPosition || "left",
    calendarTitle:    row?.calendarTitle    || { sr: "PRAZNIČNE MISIJE", en: "HOLIDAY MISSIONS" },
    logoUrl:          row?.logoUrl          || "/img/meridianbet-ng.png",
    showLogo:         row?.showLogo         ?? false,
    theme:            row?.theme            || "default",
    seoMeta:          row?.seoMeta          || DEFAULT_SEO_META,
    countdownTargetIso: row?.countdownTargetIso || "",
    countdownLabel:     row?.countdownLabel     || "",
    confetti:           row?.confetti           || null,
    closed:             row?.closed             || { enabled: false },
  });
}

export async function PUT(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Partial update — only touch fields present in the request body
  const patch = {};

  if ("bgImageUrl" in body)
    patch.bgImageUrl = (body.bgImageUrl || "").trim() || null;

  if ("bgImageUrlMobile" in body)
    patch.bgImageUrlMobile = (body.bgImageUrlMobile || "").trim() || null;

  if ("calendarPosition" in body)
    patch.calendarPosition = VALID_POS.includes(body.calendarPosition) ? body.calendarPosition : "left";

  if ("logoUrl" in body)
    patch.logoUrl = (body.logoUrl || "").trim() || null;

  if ("showLogo" in body)
    patch.showLogo = body.showLogo === true;

  if ("confetti" in body)
    patch.confetti = sanitizeConfetti(body.confetti);

  // Kalendar zatvoren za posetioce: naslov, tekst, opciono dugme (obični tekstovi — React ih
  // escape-uje pri prikazu; link prolazi istu proveru kao linkovi promocija)
  if ("closed" in body) {
    const c = body.closed || {};
    const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    patch.closed = {
      enabled: c.enabled === true,
      message: text(c.message, 120),
      buttonLabel: text(c.buttonLabel, 60),
      buttonLink: sanitizeLink(text(c.buttonLink, 500)),
    };
  }

  if ("calendarTitle" in body) {
    const t = body.calendarTitle;
    patch.calendarTitle = {
      // prazan string je dozvoljen — kalendar se tada prikazuje bez naslova
      sr: typeof t?.sr === "string" ? t.sr.trim() : "PRAZNIČNE MISIJE",
      en: (typeof t?.en === "string" ? t.en.trim() : "") || "HOLIDAY MISSIONS",
    };
  }

  if ("theme" in body)
    patch.theme = VALID_THEMES.includes(body.theme) ? body.theme : "default";

  if ("seoMeta" in body) {
    const s = body.seoMeta;
    patch.seoMeta = {
      sr: {
        title:       (typeof s?.sr?.title       === "string" ? s.sr.title.trim()       : "") || DEFAULT_SEO_META.sr.title,
        description: (typeof s?.sr?.description === "string" ? s.sr.description.trim() : "") || DEFAULT_SEO_META.sr.description,
      },
    };
  }

  if ("countdownTargetIso" in body) {
    const raw = (body.countdownTargetIso || "").trim();
    patch.countdownTargetIso = raw && !Number.isNaN(new Date(raw).getTime()) ? raw : null;
  }

  if ("countdownLabel" in body)
    patch.countdownLabel = (body.countdownLabel || "").trim() || null;

  if ("monthBackgrounds" in body) {
    let cleaned = null;
    const raw = body.monthBackgrounds;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const out = {};
      for (const [key, val] of Object.entries(raw)) {
        if (val && typeof val === "object") {
          const desktop  = (val.desktop  || "").trim() || null;
          const mobile   = (val.mobile   || "").trim() || null;
          const position = VALID_POS.includes(val.position) ? val.position : null;
          const titleSr  = (val.titleSr  || "").trim() || null;
          const inactive = val.inactive === true ? true : null;
          const theme    = VALID_THEMES.includes(val.theme) ? val.theme : null;
          // dodatni razmak iznad kalendara na desktopu, u % visine ekrana (0–40)
          const off      = Math.round(Number(val.topOffset));
          const topOffset = off > 0 ? Math.min(off, 40) : null;
          const offM     = Math.round(Number(val.topOffsetMobile));
          const topOffsetMobile = offM > 0 ? Math.min(offM, 40) : null;
          // skraćen mesec: prikazuju se samo dani od-do (1–31)
          const day = (v) => { const n = Math.round(Number(v)); return n >= 1 && n <= 31 ? n : null; };
          const dayFrom = day(val.dayFrom);
          const dayTo   = day(val.dayTo);
          const confetti = sanitizeConfetti(val.confetti);
          if (desktop || mobile || position || titleSr || inactive || theme || topOffset || topOffsetMobile || dayFrom || dayTo || confetti)
            out[key] = { desktop, mobile, position, titleSr, inactive, theme, topOffset, topOffsetMobile, dayFrom, dayTo, confetti };
        }
      }
      cleaned = Object.keys(out).length ? out : null;
    }
    patch.monthBackgrounds = cleaned;
  }

  const row = await prisma.calendarSettings.upsert({
    where:  { id: 1 },
    update: patch,
    create: { id: 1, ...patch },
  });

  revalidateTag("calendar");
  return Response.json({
    bgImageUrl:       row.bgImageUrl       || "/img/bg-calendar.png",
    bgImageUrlMobile: row.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
    monthBackgrounds: row.monthBackgrounds || {},
    calendarPosition: row.calendarPosition || "left",
    calendarTitle:    row.calendarTitle    || { sr: "PRAZNIČNE MISIJE", en: "HOLIDAY MISSIONS" },
    logoUrl:          row.logoUrl          || "/img/meridianbet-ng.png",
    showLogo:         row.showLogo,
    theme:            row.theme            || "default",
    seoMeta:          row.seoMeta          || DEFAULT_SEO_META,
    countdownTargetIso: row.countdownTargetIso || "",
    countdownLabel:     row.countdownLabel     || "",
    confetti:           row.confetti           || null,
    closed:             row.closed             || { enabled: false },
  });
}
