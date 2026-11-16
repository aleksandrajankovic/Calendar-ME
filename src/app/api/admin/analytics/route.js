// src/app/api/admin/analytics/route.js
// Analitika kalendara za admin pregled — za sada samo super admin.
export const runtime = "nodejs";

import { getAdminFromRequest } from "@/lib/auth";
import { getAnalytics, parseRange } from "@/lib/analytics";

export async function GET(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!session.isSuper) return new Response("Forbidden", { status: 403 });

  try {
    const range = parseRange(new URL(req.url).searchParams);
    return Response.json(await getAnalytics(range));
  } catch (err) {
    console.error("GET /api/admin/analytics error:", err);
    return new Response("Error", { status: 500 });
  }
}
