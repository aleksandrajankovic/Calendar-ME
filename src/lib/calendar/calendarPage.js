// src/lib/calendarPage.js
// Zajednička logika za kalendarske stranice ("/" i "/[year]/[month]")
import prisma from "@/lib/db";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { monthHref } from "@/lib/calendar/calendarUrls";
import { resolveConfetti } from "@/lib/calendar/confetti";

import { BASE_URL, ALL_PROMOS_URL } from "@/lib/market";
export * from "@/lib/calendar/calendarUrls";

export { BASE_URL };

export const MONTH_NAMES_SR = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];

// -------------------------
// NORMALIZACIJA PODATAKA
// -------------------------
function getTextFromTranslations(row, lang) {
  const translations = row.translations || {};
  const t =
    translations[lang] ||
    (Object.keys(translations).length
      ? translations[Object.keys(translations)[0]]
      : null);

  return {
    title: t?.title ?? row.title ?? "",
    button: t?.button ?? row.button ?? "",
    link: t?.link ?? row.link ?? "#",
    richHtml: t?.richHtml ?? row.richHtml ?? null,
  };
}

function normWeeklyRows(rows = [], lang) {
  const out = Array(7).fill(null);
  for (const r of rows) {
    if (typeof r.weekday === "number" && r.weekday >= 0 && r.weekday <= 6) {
      const t = getTextFromTranslations(r, lang);
      out[r.weekday] = {
        title: t.title,
        icon: r.icon || "",
        richHtml: t.richHtml,
        link: t.link,
        button: t.button,
        active: !!r.active,
        buttonColor: r.buttonColor || "green",
        category: r.category || "ALL",
        scratch: !!r.scratch,
        slot: !!r.slot,
        flipCard: !!r.flipCard,
      };
    }
  }
  return out;
}

function normalizeSpecials(rows = [], lang) {
  return rows.map((r) => {
    const t = getTextFromTranslations(r, lang);
    return {
      year: r.year,
      month: r.month,
      day: r.day,
      title: t.title,
      icon: r.icon || "",
      richHtml: t.richHtml,
      link: t.link,
      button: t.button,
      active: !!r.active,
      buttonColor: r.buttonColor || "green",
      category: r.category || "ALL",
      scratch: !!r.scratch,
      slot: !!r.slot,
      flipCard: !!r.flipCard,
      knockoutPhase: r.knockoutPhase || null,
    };
  });
}

// Keširani DB upiti za promo sadržaj — 5 minuta (settings se uvek čitaju sveže)
export const getPromoData = unstable_cache(
  async (year, month) => {
    const [weeklyPlanRows, specialRows] = await Promise.all([
      prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
      prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
    ]);
    return { weeklyPlanRows, specialRows };
  },
  ["promo-data"],
  { revalidate: 300, tags: ["calendar"] }
);

// Podešavanja kalendara za posetioce — keširana; admin API (api/calendar-settings) pri
// svakom čuvanju poziva revalidateTag("calendar"), pa izmene (npr. deaktiviran mesec,
// zatvoren kalendar) važe odmah. Admin uvek čita sveže iz baze.
const getCachedSettings = unstable_cache(
  () => prisma.calendarSettings.findFirst(),
  ["calendar-settings"],
  { revalidate: 300, tags: ["calendar"] }
);

export function getCalendarSettings(isAdmin = false) {
  return isAdmin ? prisma.calendarSettings.findFirst() : getCachedSettings();
}

// Strelice za prethodni/sledeći mesec — keširane kao i promocije (isti tag "calendar":
// čuvanje promocija ili podešavanja ih odmah osvežava)
const getCachedNearestMonth = unstable_cache(
  (y, m, direction, inactiveKeys) => findNearestMonthWithPromos(y, m, direction, new Set(inactiveKeys)),
  ["nearest-month"],
  { revalidate: 300, tags: ["calendar"] }
);

function nearestMonth(y, m, direction, inactiveSet, isAdmin) {
  return isAdmin
    ? findNearestMonthWithPromos(y, m, direction, inactiveSet)
    : getCachedNearestMonth(y, m, direction, [...inactiveSet].sort());
}

// Vraća {y, m} najbližeg meseca sa promocijama u datom smeru, preskačući neaktivne mesece
export async function findNearestMonthWithPromos(currentY, currentM, direction, inactiveSet = new Set()) {
  const isNext = direction === "next";

  const dirFilter = isNext
    ? { OR: [{ year: { gt: currentY } }, { year: currentY, month: { gt: currentM } }] }
    : { OR: [{ year: { lt: currentY } }, { year: currentY, month: { lt: currentM } }] };
  const dirOrder = isNext
    ? [{ year: "asc" }, { month: "asc" }]
    : [{ year: "desc" }, { month: "desc" }];

  const [special, plan] = await Promise.all([
    prisma.specialPromotion.findFirst({ where: { active: true, ...dirFilter }, orderBy: dirOrder }),
    prisma.weeklyPlan.findFirst({ where: { active: true, ...dirFilter }, orderBy: dirOrder }),
  ]);

  if (!special && !plan) return null;

  let candidate;
  if (!special) candidate = { y: plan.year, m: plan.month };
  else if (!plan) candidate = { y: special.year, m: special.month };
  else {
    const sOrd = special.year * 12 + special.month;
    const pOrd = plan.year * 12 + plan.month;
    const closer = isNext ? (sOrd <= pOrd ? special : plan) : (sOrd >= pOrd ? special : plan);
    candidate = { y: closer.year, m: closer.month };
  }

  // Ako je kandidat deaktiviran, traži sledeći u istom smeru
  if (inactiveSet.has(`${candidate.y}-${candidate.m}`)) {
    return findNearestMonthWithPromos(candidate.y, candidate.m, direction, inactiveSet);
  }

  return candidate;
}

// -------------------------
// METADATA
// -------------------------
export async function buildCalendarMetadata(year, month) {
  const canonical = `${BASE_URL}${monthHref(year, month)}`;

  // seoMeta from DB overrides the auto-generated per-month title/description
  const settings = await getCalendarSettings();
  const seo = settings?.seoMeta?.sr || {};

  const monthSr = MONTH_NAMES_SR[month];
  const title = seo.title || `Kalendar Promocija ${monthSr} ${year} | Meridianbet`;
  const description =
    seo.description ||
    `Otkrijte dnevne promocije za ${monthSr} ${year}. Iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija.`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { sr: canonical, "x-default": canonical },
    },
    openGraph: {
      url: canonical,
      title,
      description,
      images: [
        {
          url: "https://cloud.merbet.com/Preview-image/calendar-universal.png",
          width: 1200,
          height: 630,
          alt: "Kalendar Promocija",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://cloud.merbet.com/Preview-image/calendar-universal.png"],
    },
  };
}

// -------------------------
// PODACI ZA STRANICU
// -------------------------
export async function loadCalendarPageData({ year, month, isAdmin, lang = "sr" }) {
  // CalendarSettings: admin sveže, posetioci iz keša (briše se odmah pri čuvanju u adminu)
  const calendarSettings = await getCalendarSettings(isAdmin);
  const monthBgs = calendarSettings?.monthBackgrounds || {};

  // Redirect korisnika sa deaktiviranog meseca
  if (monthBgs[`${year}-${month}`]?.inactive && !isAdmin) {
    const inactiveSet = new Set(
      Object.entries(monthBgs)
        .filter(([, v]) => v?.inactive)
        .map(([k]) => k)
    );
    const nearest =
      (await nearestMonth(year, month, "next", inactiveSet, isAdmin)) ||
      (await nearestMonth(year, month, "prev", inactiveSet, isAdmin));
    if (nearest) redirect(monthHref(nearest.y, nearest.m));
  }

  // Load promo data — admin dobija live podatke, korisnici keširane (5 min)
  const { weeklyPlanRows, specialRows } = isAdmin
    ? await (async () => {
        const [weeklyPlanRows, specialRows] = await Promise.all([
          prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
          prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
        ]);
        return { weeklyPlanRows, specialRows };
      })()
    : await getPromoData(year, month);

  const planned = normWeeklyRows(weeklyPlanRows, lang);

  const weekly = Array.from(
    { length: 7 },
    (_, i) =>
      planned[i] ?? {
        title: "",
        icon: "",
        richHtml: null,
        link: "#",
        button: "",
        active: false,
        buttonColor: "green",
        category: "ALL",
      }
  );

  const specials = normalizeSpecials(specialRows, lang);

  // background za kalendar — per-month override ima prioritet nad globalnim
  const monthBg = monthBgs[`${year}-${month}`] || {};
  const bgImageUrl = monthBg.desktop || calendarSettings?.bgImageUrl || "/img/bg-calendar.png";
  const bgImageUrlMobile = monthBg.mobile || calendarSettings?.bgImageUrlMobile || bgImageUrl;

  // pozicija kalendara — per-month override > global default
  const pos = monthBg.position || calendarSettings?.calendarPosition || "left";

  // dodatni razmak iznad kalendara (desktop, vh) — da kalendar ne prekriva naslov na pozadini
  const topOffset = monthBg.topOffset || 0;
  const topOffsetMobile = monthBg.topOffsetMobile || 0;

  // skraćen mesec — prikazuju se samo dani od-do (npr. kampanja 15–31)
  const dayFrom = monthBg.dayFrom || null;
  const dayTo = monthBg.dayTo || null;

  // naslov kalendara — per-month override > global calendarTitle > hardcoded fallback;
  // prazan globalni naslov ("") znači da se naslov ne prikazuje
  const monthTitle = monthBg.titleSr;
  const globalTitles = calendarSettings?.calendarTitle || {};
  const calendarTitle = monthTitle || (globalTitles["sr"] ?? "PRAZNIČNE MISIJE");

  // tema kalendara — per-month override > global default
  const theme = monthBg.theme || calendarSettings?.theme || "default";

  // konfete posle grebanja — per-month override > global > po temi
  const confetti = resolveConfetti({
    monthConfetti: monthBg.confetti,
    globalConfetti: calendarSettings?.confetti,
    theme,
  });

  // logo u traci na vrhu — prikazuje se samo kad je uključen u adminu
  const showLogo = !!calendarSettings?.showLogo;
  const logoUrl = calendarSettings?.logoUrl || "/img/meridianbet-ng.png";

  // Skup deaktivovanih meseci za paginaciju
  const inactiveSet = new Set(
    Object.entries(monthBgs)
      .filter(([, v]) => v?.inactive)
      .map(([k]) => k)
  );

  const isMonthInactive = !!monthBg.inactive;

  // Ceo kalendar zatvoren (npr. kampanja završena): posetilac vidi samo pozadinu i poruku,
  // admin i dalje vidi kalendar (uz oznaku u admin traci)
  const c = calendarSettings?.closed || {};
  const isClosed = !!c.enabled;
  const closedInfo = {
    title: c.message || "Kampanja je završena",
    // dugme podrazumevano vodi na stranicu sa svim promocijama
    buttonLabel: c.buttonLabel || "Pogledaj sve promocije",
    buttonLink: c.buttonLink || ALL_PROMOS_URL,
  };

  // Odbrojavanje — podešeno u admin panelu; fallback zadržava dosadašnje ponašanje dok se ne podesi
  const countdownTargetIso = calendarSettings?.countdownTargetIso || "2026-06-11T00:00:00";
  const countdownLabel = calendarSettings?.countdownLabel || "Kalendar se otvara za";

  // Pagination for months — preskačemo deaktivovane mesece
  const [prevMonth, nextMonth] = await Promise.all([
    nearestMonth(year, month, "prev", inactiveSet, isAdmin),
    nearestMonth(year, month, "next", inactiveSet, isAdmin),
  ]);

  return {
    weekly,
    specials,
    bgImageUrl,
    bgImageUrlMobile,
    pos,
    calendarTitle,
    topOffset,
    topOffsetMobile,
    dayFrom,
    dayTo,
    theme,
    confetti,
    showLogo,
    logoUrl,
    isMonthInactive,
    isClosed,
    closedInfo,
    prevMonth,
    nextMonth,
    countdownTargetIso,
    countdownLabel,
  };
}
