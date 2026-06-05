// src/app/page.js
import CalendarGrid from "@/components/CalendarGrid";
import CalendarEnhancer from "@/components/CalendarEnhancer";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import SnowAuto from "@/components/SnowAuto";
import { notFound, redirect } from "next/navigation";
import { bebasNeue } from "@/app/fonts";

const LANG = "sr";

// -------------------------
// HELPERS
// -------------------------
function prevYM(y, m) {
  return m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
}

function nextYM(y, m) {
  return m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 };
}

function getParam(sp, key) {
  if (!sp) return undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

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
    };
  });
}

function getMonthLabel(year, month) {
  const raw = new Date(year, month, 1).toLocaleString("sr-Latn-ME", { month: "long" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// -------------------------
// ALLOWED MONTHS
// -------------------------
function keyYM(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

async function getAllowedMonths(prismaClient) {
  const specialMonths = await prismaClient.specialPromotion.findMany({
    select: { year: true, month: true },
    distinct: ["year", "month"],
  });

  const map = new Map();
  for (const r of specialMonths) {
    if (Number.isInteger(r.year) && Number.isInteger(r.month) && r.month >= 0 && r.month <= 11) {
      map.set(keyYM(r.year, r.month), { year: r.year, month: r.month });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.year - b.year || a.month - b.month);
}

// -------------------------
// PAGE COMPONENT
// -------------------------
export default async function Home({ searchParams }) {
  const sp = await searchParams;

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_auth");
  const isAdmin = !!adminCookie?.value;

  const now = new Date();

  const yRaw = getParam(sp, "y");
  const mRaw = getParam(sp, "m");

  const reqYear = Number.parseInt(yRaw ?? "", 10);
  const reqMonth = Number.parseInt(mRaw ?? "", 10);

  const year = Number.isInteger(reqYear) ? reqYear : now.getFullYear();
  const month =
    Number.isInteger(reqMonth) && reqMonth >= 0 && reqMonth <= 11
      ? reqMonth
      : now.getMonth();

  const allowedMonths = await getAllowedMonths(prisma);

  if (allowedMonths.length > 0) {
    const requestedHasParams = yRaw != null || mRaw != null;
    const allowedSet = new Set(allowedMonths.map((x) => keyYM(x.year, x.month)));
    const requestedKey = keyYM(year, month);

    if (requestedHasParams && !allowedSet.has(requestedKey)) {
      notFound();
    }

    if (!requestedHasParams && !allowedSet.has(requestedKey)) {
      const latest = allowedMonths[allowedMonths.length - 1];
      redirect(`/?y=${latest.year}&m=${latest.month}`);
    }
  }

  const [weeklyDefaults, weeklyPlanRows, specialRows, calendarSettings] =
    await Promise.all([
      prisma.weeklyPromotion.findMany({ orderBy: { weekday: "asc" } }),
      prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
      prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
      prisma.calendarSettings.findFirst(),
    ]);

  const defaults = normWeeklyRows(weeklyDefaults, LANG);
  const planned  = normWeeklyRows(weeklyPlanRows, LANG);

  const weekly = Array.from(
    { length: 7 },
    (_, i) =>
      planned[i] ??
      defaults[i] ?? {
        title: "", icon: "", richHtml: null, link: "#",
        button: "", active: false, buttonColor: "green", category: "ALL", scratch: false,
      },
  );

  const specials = normalizeSpecials(specialRows, LANG);

  // ── Per-month override logic ──────────────────────────────────────────────
  const monthBgs = calendarSettings?.monthBackgrounds || {};
  const monthBg  = monthBgs[`${year}-${month}`] || {};

  const bgImageUrl       = monthBg.desktop  || calendarSettings?.bgImageUrl       || "/img/bg-calendar.png";
  const bgImageUrlMobile = monthBg.mobile   || calendarSettings?.bgImageUrlMobile || bgImageUrl;
  const logoUrl          = calendarSettings?.logoUrl || "/img/logo.svg";
  const theme            = monthBg.theme    || calendarSettings?.theme            || "default";
  const calendarTitle    = monthBg.titleSr  || calendarSettings?.calendarTitle?.sr || "Proljećni Kalendar";

  // Calendar position (desktop alignment)
  const pos = monthBg.position || calendarSettings?.calendarPosition || "left";
  const mainJustify =
    pos === "center" ? "md:justify-center" :
    pos === "right"  ? "md:justify-end"    : "md:justify-start";
  const innerMargin =
    pos === "center" ? "mx-auto" :
    pos === "right"  ? "mx-auto md:mx-0 md:ml-auto" : "mx-auto md:mx-0 md:mr-auto";
  const headingAlign =
    pos === "center" ? "md:text-center" :
    pos === "right"  ? "md:text-right"  : "md:text-left";
  // ──────────────────────────────────────────────────────────────────────────

  // Pagination
  let p = null;
  let n = null;

  if (allowedMonths.length > 0) {
    const idx = allowedMonths.findIndex((x) => x.year === year && x.month === month);
    if (idx > 0) p = allowedMonths[idx - 1];
    if (idx >= 0 && idx < allowedMonths.length - 1) n = allowedMonths[idx + 1];
  } else {
    p = prevYM(year, month);
    n = nextYM(year, month);
  }

  // Normalize to { y, m } for MonthPagination component
  const prevM = p ? { y: p.year ?? p.y, m: p.month ?? p.m } : null;
  const nextM = n ? { y: n.year ?? n.y, m: n.month ?? n.m } : null;

  const monthLabel = getMonthLabel(year, month);

  const hrefFor = (obj) => {
    if (!obj) return "#";
    const yy = obj.year ?? obj.y;
    const mm = obj.month ?? obj.m;
    return `/?y=${yy}&m=${mm}`;
  };

  const isFootball = theme === "football";

  return (
    <div className="min-h-dvh flex flex-col overflow-hidden">
      {/* TOP HEADER BAR — always transparent overlay, logo centered */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-center px-4 py-6">
        <a href="https://meridianbet.me/" target="_blank" rel="noreferrer">
          <img src={logoUrl} alt="Meridianbet" className="h-8 md:h-10 w-auto" />
        </a>
      </header>

      {/* MAIN CONTENT */}
      <main
        className={`relative z-0 w-full flex-1 bg-no-repeat bg-cover bg-center calendar-bg overflow-hidden md:overflow-auto flex justify-center ${mainJustify}`}
        style={{ backgroundImage: `url("${bgImageUrl}")` }}
      >
        {/* MOBILE BG */}
        <div
          className="pointer-events-none absolute inset-0 md:hidden bg-no-repeat bg-cover bg-center -z-10 calendar-mobile-bg"
          style={{ backgroundImage: `url("${bgImageUrlMobile}")` }}
        />

        <SnowAuto />

        <div className={`relative z-10 w-full max-w-6xl px-4 sm:px-6 md:px-10 lg:px-16 pt-4 pb-4 md:pt-6 md:pb-10 ${innerMargin}`}>

          {/* Calendar title — football: Bebas Neue centered, default: bold aligned */}
          <h1
            className={`text-white ${
              isFootball
                ? `text-[28px] md:text-[44px] font-normal tracking-[0.06em] text-center ${bebasNeue.className} mt-10 mb-4 md:mt-10 md:mb-10`
                : `text-3xl md:text-5xl font-extrabold tracking-tight mt-16 mb-6 text-center ${headingAlign}`
            }`}
          >
            {calendarTitle}
          </h1>

          {isAdmin && (
            <div className="mt-2 inline-block rounded bg-amber-500/20 text-amber-200 px-3 py-1 text-sm">
              Admin preview
            </div>
          )}

          {/* MOBILE PAGINATION — hidden in football (CalendarMobileFootball has own pagination) */}
          {!isFootball && (
            <div className="mt-6 flex items-center justify-center md:hidden">
              <div className="inline-flex items-center gap-4 rounded-full bg-black/40 px-4 py-2 text-white text-sm">
                {p ? (
                  <a href={hrefFor(p)} className="p-1 hover:opacity-80" aria-label="Previous month">‹</a>
                ) : (
                  <span className="p-1 opacity-40 cursor-not-allowed" aria-hidden="true">‹</span>
                )}
                <span className="min-w-[140px] text-center font-semibold">
                  {monthLabel} <span className="ml-1 opacity-80">{year}</span>
                </span>
                {n ? (
                  <a href={hrefFor(n)} className="p-1 hover:opacity-80" aria-label="Next month">›</a>
                ) : (
                  <span className="p-1 opacity-40 cursor-not-allowed" aria-hidden="true">›</span>
                )}
              </div>
            </div>
          )}

          <div className={isFootball ? "mt-2 md:mt-1" : "mt-6"}>
            <CalendarGrid
              year={year}
              month={month}
              weekly={weekly}
              specials={specials}
              adminPreview={isAdmin}
              lang={LANG}
              theme={theme}
              prevMonth={prevM}
              nextMonth={nextM}
            />
          </div>

          <CalendarEnhancer adminPreview={isAdmin} lang={LANG} />

          {/* DESKTOP PAGINATION */}
          <div className="md:flex items-center justify-center hidden">
            <div className="inline-flex items-center gap-4 rounded-full bg-black/40 px-4 py-2 text-white text-sm md:text-base">
              {p ? (
                <a href={hrefFor(p)} className="p-1 hover:opacity-80" aria-label="Previous month">‹</a>
              ) : (
                <span className="p-1 opacity-40 cursor-not-allowed" aria-hidden="true">‹</span>
              )}
              <span className="min-w-[140px] text-center font-semibold">
                {monthLabel} <span className="ml-1 opacity-80">{year}</span>
              </span>
              {n ? (
                <a href={hrefFor(n)} className="p-1 hover:opacity-80" aria-label="Next month">›</a>
              ) : (
                <span className="p-1 opacity-40 cursor-not-allowed" aria-hidden="true">›</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
