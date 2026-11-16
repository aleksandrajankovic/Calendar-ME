// src/app/api/weekly-plan/copy/route.js
// POST { year, month } — prepiše nedeljne promocije iz prethodnog meseca u ovaj, samo za dane
// koji su još prazni, kao NEAKTIVNE nacrte (admin ih pregleda i aktivira). Kao na promo-platform.
export const runtime = "nodejs";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COPIED_FIELDS = [
  "title", "link", "button", "icon", "rich", "richHtml", "buttonColor",
  "scratch", "slot", "flipCard", "translations", "category",
];

export async function POST(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const year = Number.parseInt(body.year, 10);
  const month = Number.parseInt(body.month, 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return new Response("Bad payload", { status: 400 });
  }

  const from = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const fromLabel = `${MONTHS[from.month]} ${from.year}`;

  const [sourceRows, targetRows] = await Promise.all([
    prisma.weeklyPlan.findMany({ where: { year: from.year, month: from.month }, orderBy: { weekday: "asc" } }),
    prisma.weeklyPlan.findMany({ where: { year, month }, select: { weekday: true } }),
  ]);
  if (!sourceRows.length) return new Response(`${fromLabel} has no weekly promotions to copy.`, { status: 404 });

  const taken = new Set(targetRows.map((r) => r.weekday));
  const plan = sourceRows
    .filter((r) => !taken.has(r.weekday))
    .map((r) => {
      const data = { year, month, weekday: r.weekday, active: false };
      for (const field of COPIED_FIELDS) {
        if (r[field] !== undefined && r[field] !== null) data[field] = r[field];
      }
      return data;
    });

  const created = await prisma.$transaction(plan.map((data) => prisma.weeklyPlan.create({ data })));

  revalidateTag("calendar");
  return Response.json({ created, fromLabel, skipped: sourceRows.length - plan.length });
}
