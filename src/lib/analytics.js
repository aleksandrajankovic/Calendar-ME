// src/lib/analytics.js
// Upiti za analitiku kalendara (admin pregled i CSV export). Datumi su po
// lokalnom vremenu (TIME_ZONE iz market.js); "createdAt" se čuva u UTC (Prisma).
import prisma from "@/lib/db";

import { TIME_ZONE } from "@/lib/market";
const LOCAL_DATE = `(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE '${TIME_ZONE}')::date`;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

// ?from=YYYY-MM-DD&to=YYYY-MM-DD — podrazumevano od početka tekućeg meseca do danas
export function parseRange(searchParams) {
  const t = today();
  let from = searchParams.get("from");
  let to = searchParams.get("to");
  if (!ISO_RE.test(from || "")) from = `${t.slice(0, 7)}-01`;
  if (!ISO_RE.test(to || "")) to = t;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

// Postgres COUNT vraća BigInt — u običan broj, da prođe kroz JSON
function num(rows) {
  return rows.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v]))
  );
}

const COUNTS = `
  COUNT(*) FILTER (WHERE type = 'view')     AS views,
  COUNT(DISTINCT visitor) FILTER (WHERE type = 'view') AS visitors,
  COUNT(*) FILTER (WHERE type = 'day_open') AS opens,
  COUNT(*) FILTER (WHERE type IN ('scratch', 'slot'))  AS scratches,
  COUNT(*) FILTER (WHERE type = 'cta')      AS ctas`;

export async function getAnalytics({ from, to }) {
  const where = `${LOCAL_DATE} BETWEEN $1::date AND $2::date`;

  const [totals, byDate, byPromo, byDevice] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT ${COUNTS} FROM "CalendarEvent" WHERE ${where}`, from, to),
    prisma.$queryRawUnsafe(
      `SELECT to_char(${LOCAL_DATE}, 'YYYY-MM-DD') AS date, ${COUNTS}
       FROM "CalendarEvent" WHERE ${where}
       GROUP BY 1 ORDER BY 1`,
      from, to
    ),
    prisma.$queryRawUnsafe(
      `SELECT year, month, day, MAX(title) AS title, MAX("promoType") AS "promoType",
         COUNT(*) FILTER (WHERE type = 'day_open') AS opens,
         COUNT(DISTINCT visitor) FILTER (WHERE type = 'day_open') AS "openVisitors",
         COUNT(*) FILTER (WHERE type IN ('scratch', 'slot'))  AS scratches,
         COUNT(*) FILTER (WHERE type = 'cta')      AS ctas
       FROM "CalendarEvent"
       WHERE ${where} AND type IN ('day_open', 'scratch', 'slot', 'cta') AND day IS NOT NULL
       GROUP BY year, month, day ORDER BY year, month, day`,
      from, to
    ),
    prisma.$queryRawUnsafe(
      `SELECT device, embedded, COUNT(*) AS views
       FROM "CalendarEvent" WHERE ${where} AND type = 'view'
       GROUP BY device, embedded ORDER BY views DESC`,
      from, to
    ),
  ]);

  return {
    from,
    to,
    totals: num(totals)[0],
    byDate: num(byDate),
    byPromo: num(byPromo),
    byDevice: num(byDevice),
  };
}

export async function getEvents({ from, to }) {
  return prisma.$queryRawUnsafe(
    `SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE '${TIME_ZONE}', 'YYYY-MM-DD HH24:MI:SS') AS time,
       type, year, month, day, "promoType", title, device, embedded, visitor
     FROM "CalendarEvent"
     WHERE ${LOCAL_DATE} BETWEEN $1::date AND $2::date
     ORDER BY "createdAt"
     LIMIT 200000`,
    from, to
  );
}
