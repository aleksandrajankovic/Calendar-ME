// src/app/api/admin/analytics/export/route.js
// CSV export analitike: ?kind=daily (po datumu) | promos (po danu kalendara) | events (svi događaji).
// Separator ";" i UTF-8 BOM — Excel sa srpskim podešavanjima tako otvara kolone i ćirilicu/latinicu ispravno.
export const runtime = "nodejs";

import { getAdminFromRequest } from "@/lib/auth";
import { getAnalytics, getEvents, parseRange } from "@/lib/analytics";

function cell(v) {
  if (v == null) return "";
  const s = String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(header, rows) {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}

const pad = (n) => String(n).padStart(2, "0");

export async function GET(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!session.isSuper) return new Response("Forbidden", { status: 403 });

  try {
    const params = new URL(req.url).searchParams;
    const range = parseRange(params);
    const kind = params.get("kind") || "daily";

    let csv;
    if (kind === "events") {
      const rows = await getEvents(range);
      csv = toCsv(
        ["Vrijeme", "Događaj", "Dan kalendara", "Tip promocije", "Promocija", "Uređaj", "U iframe-u", "Posjetilac (dnevni ID)"],
        rows.map((r) => [
          r.time,
          r.type,
          r.day ? `${r.year}-${pad(r.month + 1)}-${pad(r.day)}` : "",
          r.promoType,
          r.title,
          r.device,
          r.embedded ? "da" : "ne",
          r.visitor,
        ])
      );
    } else {
      const data = await getAnalytics(range);
      if (kind === "promos") {
        csv = toCsv(
          ["Dan kalendara", "Promocija", "Tip", "Otvaranja", "Jedinstvenih otvaranja", "Otkriveno (grebalica/slot)", "Klik na dugme"],
          data.byPromo.map((r) => [
            `${r.year}-${pad(r.month + 1)}-${pad(r.day)}`,
            r.title,
            r.promoType,
            r.opens,
            r.openVisitors,
            r.scratches,
            r.ctas,
          ])
        );
      } else {
        csv = toCsv(
          ["Datum", "Prikazi", "Posjetioci", "Otvaranja dana", "Otkriveno (grebalica/slot)", "Klik na dugme"],
          data.byDate.map((r) => [r.date, r.views, r.visitors, r.opens, r.scratches, r.ctas])
        );
      }
    }

    const name = `kalendar-analitika-${kind}-${range.from}_${range.to}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/admin/analytics/export error:", err);
    return new Response("Error", { status: 500 });
  }
}
