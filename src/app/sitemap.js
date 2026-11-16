// src/app/sitemap.js
import prisma from "@/lib/db";
import { BASE_URL, monthHref } from "@/lib/calendar/calendarPage";

// Generiše se po zahtevu, ne u build-u: Docker build nema DATABASE_URL, pa bi
// prerender (upit u bazu) oborio ceo build. Uz to su novi specijali iz admina odmah vidljivi.
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [weeklyMonths, specialMonths, settings] = await Promise.all([
    prisma.weeklyPlan.findMany({
      where: { active: true },
      select: { year: true, month: true },
      distinct: ["year", "month"],
    }),
    prisma.specialPromotion.findMany({
      where: { active: true },
      select: { year: true, month: true },
      distinct: ["year", "month"],
    }),
    prisma.calendarSettings.findFirst(),
  ]);

  const monthBgs = settings?.monthBackgrounds || {};

  const seen = new Set();
  const months = [];
  for (const { year, month } of [...weeklyMonths, ...specialMonths]) {
    const key = `${year}-${month}`;
    if (seen.has(key) || monthBgs[key]?.inactive) continue;
    seen.add(key);
    months.push({ year, month });
  }

  // "/" (tekući mesec) uvek ide prvo, sa najvišim prioritetom
  const urlMap = new Map();
  urlMap.set(`${BASE_URL}/`, {
    url: `${BASE_URL}/`,
    changeFrequency: "daily",
    priority: 1,
  });

  for (const { year, month } of months) {
    const url = `${BASE_URL}${monthHref(year, month)}`;
    if (urlMap.has(url)) continue;
    urlMap.set(url, { url, changeFrequency: "monthly", priority: 0.6 });
  }

  return Array.from(urlMap.values());
}
