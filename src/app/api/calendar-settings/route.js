export const runtime = "nodejs";
import prisma from "@/lib/db";

/* helper: pročitaj ID admina iz cookie-ja */
function getAdminIdFromCookie(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_auth=(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

/* ---------- GET /api/calendar-settings ---------- */
export async function GET(req) {
  const adminId = getAdminIdFromCookie(req);
  if (!adminId) return new Response("unauthorized", { status: 401 });

  const row = await prisma.calendarSettings.findFirst();

  return Response.json({
    bgImageUrl: row?.bgImageUrl || "/img/bg-calendar.png",

    bgImageUrlMobile: row?.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
  });
}

/* ---------- PUT /api/calendar-settings ---------- */
export async function PUT(req) {
  const adminId = getAdminIdFromCookie(req);
  if (!adminId) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  const rawDesktop = (body.bgImageUrl || "").trim();
  const rawMobile = (body.bgImageUrlMobile || "").trim();

  const bgImageUrl = rawDesktop || null;        // prazno → null
  const bgImageUrlMobile = rawMobile || null;   // prazno → null

  const row = await prisma.calendarSettings.upsert({
    where: { id: 1 },
    update: { bgImageUrl, bgImageUrlMobile },
    create: { id: 1, bgImageUrl, bgImageUrlMobile },
  });

  return Response.json({
    bgImageUrl: row.bgImageUrl || "/img/bg-calendar.png",
    bgImageUrlMobile:
      row.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
  });
}
