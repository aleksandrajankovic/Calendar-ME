export const runtime = "nodejs";
import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { sanitizeLink } from "@/lib/validate";

const DEFAULT_LANG = "sr";

// GET /api/specials
export async function GET(req) {
  const payload = await getAdminFromRequest(req);
  if (!payload) {
    return new Response("unauthorized", { status: 401 });
  }

  const rows = await prisma.specialPromotion.findMany();

  const safe = rows.map((r) => ({
    ...r,
    richHtml: r.richHtml ?? null,
    scratch: !!r.scratch,
  }));

  return Response.json(safe);
}

// POST /api/specials
export async function POST(req) {
  const payload = await getAdminFromRequest(req);
  if (!payload) {
    return new Response("unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const {
    year,
    month,
    day,

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

  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof day !== "number" ||
    !(title || mainT.title)
  ) {
    return new Response("bad payload", { status: 400 });
  }

  const created = await prisma.specialPromotion.create({
    data: {
      year,
      month,
      day,

      title: mainT.title ?? title ?? "",
      button: mainT.button ?? button ?? "",
      link: sanitizeLink(mainT.link ?? link ?? ""),
      rich: mainT.rich ?? rich ?? null,
      richHtml: sanitizeRichHtml(mainT.richHtml ?? richHtml ?? null),

      icon: icon ?? "",
      active: typeof active === "boolean" ? active : true,
      scratch: !!scratch,
      buttonColor: buttonColor || "green",

      translations: Object.keys(translations).length ? translations : null,
      category: category || "ALL",
    },
  });

  return Response.json(created, { status: 201 });
}
