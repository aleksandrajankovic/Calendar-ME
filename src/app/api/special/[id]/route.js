export const runtime = "nodejs";
import prisma from "@/lib/db";

const DEFAULT_LANG = "pt";

// helper: pročitaj ID admina iz cookie-ja
function getAdminIdFromCookie(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_auth=(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

/* ---------- PUT /api/special/:id ---------- */
// čuvanje / update special promocije
export async function PUT(req, { params }) {
  const adminId = getAdminIdFromCookie(req);
  if (!adminId) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const specialId = Number.parseInt(id, 10);
  if (!Number.isInteger(specialId)) {
    return new Response("bad id", { status: 400 });
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

  const rawTitle = (title ?? "").trim();
  const mainTitle = (mainT.title ?? "").trim();

  if (!rawTitle && !mainTitle) {
    return new Response("Title is required", { status: 400 });
  }

  const data = {
    year,
    month,
    day,

    title: mainT.title ?? title ?? "",
    button: mainT.button ?? button ?? "",
    link: mainT.link ?? link ?? "",
    rich: mainT.rich ?? rich ?? null,
    richHtml: mainT.richHtml ?? richHtml ?? null,

    icon: icon ?? "",
    active: !!active,
    scratch: !!scratch,
    buttonColor: buttonColor || "green",

    translations: Object.keys(translations).length ? translations : null,
    category: category || "ALL",
  };

  const row = await prisma.specialPromotion.upsert({
    where: { id: specialId },
    update: data,
    create: { id: specialId, ...data },
  });

  return Response.json(row);
}

/* ---------- PATCH /api/special/:id ---------- */
// toggle active / scratch
export async function PATCH(req, { params }) {
  const adminId = getAdminIdFromCookie(req);
  if (!adminId) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const specialId = Number.parseInt(id, 10);
  if (!Number.isInteger(specialId)) {
    return new Response("bad id", { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const patch = {
    ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    ...(typeof body.scratch === "boolean" ? { scratch: body.scratch } : {}),
  };

  if (Object.keys(patch).length === 0) {
    return new Response("bad payload", { status: 400 });
  }

  try {
    const row = await prisma.specialPromotion.update({
      where: { id: specialId },
      data: patch,
    });
    return Response.json(row);
  } catch {
    return new Response("not found", { status: 404 });
  }
}

/* ---------- DELETE /api/special/:id ---------- */
export async function DELETE(req, { params }) {
  const adminId = getAdminIdFromCookie(req);
  if (!adminId) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const specialId = Number.parseInt(id, 10);
  if (!Number.isInteger(specialId)) {
    return new Response("bad id", { status: 400 });
  }

  await prisma.specialPromotion
    .delete({ where: { id: specialId } })
    .catch(() => {});

  return new Response(null, { status: 204 });
}