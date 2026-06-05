// app/api/weekly/[weekday]/route.js
export const runtime = "nodejs";
import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { sanitizeLink } from "@/lib/validate";

const DEFAULT_LANG = "ba";
export const revalidate = 3600;

function parseWeekdayParam(params) {
  const n = Number.parseInt(params?.weekday, 10);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null;
}

// PUT /api/weekly/:weekday  (upsert)
export async function PUT(req, context) {
  const payload = await getAdminFromRequest(req);
  if (!payload) return new Response("unauthorized", { status: 401 });

  const params = await context.params;
  const weekday = parseWeekdayParam(params);
  if (weekday === null) return new Response("bad weekday", { status: 400 });

  const body = await req.json().catch(() => ({}));

  const {
    icon,
    link,
    buttonColor,
    active,
    scratch,

    title,
    button,
    rich,
    richHtml,

    translations: rawTranslations,
    defaultLang,
    category,
  } = body;

  const translations = rawTranslations || {};
  const mainLang = defaultLang || DEFAULT_LANG;
  const mainT = translations[mainLang] || {};

  const data = {
    weekday,

    title: mainT.title ?? title ?? "",
    button: mainT.button ?? button ?? "",
    rich: mainT.rich ?? rich ?? null,
    richHtml: sanitizeRichHtml(mainT.richHtml ?? richHtml ?? null),
    link: sanitizeLink(mainT.link ?? link ?? ""),

    icon: icon ?? "",
    active: typeof active === "boolean" ? active : true,
    scratch: !!scratch,
    buttonColor: buttonColor || "green",

    translations: Object.keys(translations).length ? translations : null,
    category: category || "ALL",
  };

  const row = await prisma.weeklyPromotion.upsert({
    where: { weekday },
    create: data,
    update: data,
  });

  return Response.json(row);
}

// PATCH /api/weekly/:weekday  { active?: boolean, scratch?: boolean }
export async function PATCH(req, context) {
  const payload = await getAdminFromRequest(req);
  if (!payload) return new Response("unauthorized", { status: 401 });

  const params = await context.params;
  const weekday = parseWeekdayParam(params);
  if (weekday === null) return new Response("bad weekday", { status: 400 });

  const body = await req.json().catch(() => ({}));

  const patch = {
    ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    ...(typeof body.scratch === "boolean" ? { scratch: body.scratch } : {}),
  };

  if (Object.keys(patch).length === 0) {
    return new Response("bad payload", { status: 400 });
  }

  try {
    const row = await prisma.weeklyPromotion.update({
      where: { weekday },
      data: patch,
    });
    return Response.json(row);
  } catch {
    return new Response("not found", { status: 404 });
  }
}

// DELETE /api/weekly/:weekday
export async function DELETE(req, context) {
  const payload = await getAdminFromRequest(req);
  if (!payload) return new Response("unauthorized", { status: 401 });

  const params = await context.params;
  const weekday = parseWeekdayParam(params);
  if (weekday === null) return new Response("bad weekday", { status: 400 });

  try {
    await prisma.weeklyPromotion.delete({ where: { weekday } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
