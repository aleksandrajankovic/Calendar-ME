// src/app/api/track/route.js
// Prijem događaja analitike kalendara (src/lib/calendar/track.js). Javna ruta:
// validira polja, preskače botove i ograničava broj događaja po IP adresi.
// Uvek vraća 204 — ni greška u bazi ne sme da se vidi posetiocu.
export const runtime = "nodejs";

import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getClientIp } from "@/lib/clientIp";

import { TIME_ZONE } from "@/lib/market";
const TYPES = new Set(["view", "day_open", "scratch", "slot", "cta"]);
const BOT_RE = /bot|crawl|spider|slurp|preview|lighthouse|headless|curl|wget/i;

// Najviše 120 događaja u minuti po IP adresi (in-memory, kao lib/rateLimit.js)
const LIMIT = 120;
const WINDOW_MS = 60 * 1000;
const hits = new Map();

function overLimit(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    if (hits.size > 10000) hits.clear();
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

function intIn(v, min, max) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

// Dnevni anonimni posetilac: isti IP + pregledač istog dana = isti heš, sutra drugi.
// Ne čuva se ni IP ni bilo šta na uređaju posetioca.
function visitorHash(ip, ua) {
  const date = new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
  const salt = process.env.JWT_SECRET || "";
  return crypto.createHash("sha256").update(`${salt}|${date}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

const noContent = () => new Response(null, { status: 204 });

export async function POST(req) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOT_RE.test(ua)) return noContent();

    const ip = getClientIp(req);
    if (overLimit(ip)) return noContent();

    const raw = await req.text();
    if (raw.length > 2000) return noContent();
    const body = JSON.parse(raw);
    if (!TYPES.has(body?.type)) return noContent();

    await prisma.calendarEvent.create({
      data: {
        type: body.type,
        year: intIn(body.year, 2000, 2100),
        month: intIn(body.month, 0, 11),
        day: intIn(body.day, 1, 31),
        promoType: ["special", "weekly"].includes(body.promoType) ? body.promoType : null,
        title: typeof body.title === "string" ? body.title.slice(0, 200) : null,
        device: body.device === "mobile" ? "mobile" : "desktop",
        embedded: body.embedded === true,
        visitor: visitorHash(ip, ua),
      },
    });
  } catch (err) {
    console.error("POST /api/track error:", err?.message || err);
  }
  return noContent();
}
