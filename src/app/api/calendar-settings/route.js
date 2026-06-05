export const runtime = "nodejs";

import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

const VALID_THEMES    = ["default", "default-horizontal", "football"];
const VALID_POSITIONS = ["left", "center", "right"];

export async function GET(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const row = await prisma.calendarSettings.findFirst();
  return Response.json({
    bgImageUrl:       row?.bgImageUrl       || "/img/bg-calendar.png",
    bgImageUrlMobile: row?.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
    theme:            row?.theme            || "default",
    logoUrl:          row?.logoUrl          || "/img/logo.svg",
    calendarTitle:    row?.calendarTitle    || { sr: "Proljećni Kalendar" },
    calendarPosition: row?.calendarPosition || "left",
    monthBackgrounds: row?.monthBackgrounds || {},
  });
}

export async function PUT(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch = {};

  if ("bgImageUrl" in body)
    patch.bgImageUrl = (body.bgImageUrl || "").trim() || null;

  if ("bgImageUrlMobile" in body)
    patch.bgImageUrlMobile = (body.bgImageUrlMobile || "").trim() || null;

  if ("theme" in body)
    patch.theme = VALID_THEMES.includes(body.theme) ? body.theme : "default";

  if ("logoUrl" in body)
    patch.logoUrl = (body.logoUrl || "").trim() || null;

  if ("calendarTitle" in body) {
    const t = body.calendarTitle;
    patch.calendarTitle = {
      sr: (typeof t?.sr === "string" ? t.sr.trim() : "") || "Proljećni Kalendar",
    };
  }

  if ("calendarPosition" in body)
    patch.calendarPosition = VALID_POSITIONS.includes(body.calendarPosition) ? body.calendarPosition : "left";

  if ("monthBackgrounds" in body) {
    let cleaned = null;
    const raw = body.monthBackgrounds;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const out = {};
      for (const [key, val] of Object.entries(raw)) {
        if (val && typeof val === "object") {
          const desktop  = (val.desktop  || "").trim() || null;
          const mobile   = (val.mobile   || "").trim() || null;
          const position = VALID_POSITIONS.includes(val.position) ? val.position : null;
          const titleSr  = (val.titleSr  || "").trim() || null;
          const inactive = val.inactive === true ? true : null;
          const theme    = VALID_THEMES.includes(val.theme) ? val.theme : null;
          if (desktop || mobile || position || titleSr || inactive || theme)
            out[key] = { desktop, mobile, position, titleSr, inactive, theme };
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

  return Response.json({
    bgImageUrl:       row.bgImageUrl       || "/img/bg-calendar.png",
    bgImageUrlMobile: row.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
    theme:            row.theme            || "default",
    logoUrl:          row.logoUrl          || "/img/logo.svg",
    calendarTitle:    row.calendarTitle    || { sr: "Proljećni Kalendar" },
    calendarPosition: row.calendarPosition || "left",
    monthBackgrounds: row.monthBackgrounds || {},
  });
}
