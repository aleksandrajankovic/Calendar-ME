// src/components/CalendarPageView.js
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarEnhancer from "@/components/calendar/CalendarEnhancer";
import MonthPagination from "@/components/calendar/MonthPagination";
import SnowOverlay from "@/components/calendar/SnowOverlay";
import AdminLogoutButton from "@/components/calendar/AdminLogoutButton";
import CountdownTimer from "@/components/calendar/CountdownTimer";
import CalendarClosed from "@/components/calendar/CalendarClosed";
import { bebasNeue, exo2Black } from "@/app/fonts";

import { MAIN_SITE_URL, UI } from "@/lib/market";
export default function CalendarPageView({
  year,
  month,
  isAdmin,
  lang,
  today,
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
  openDay,
  countdownTargetIso,
  countdownLabel,
}) {
  const mainJustify =
    pos === "center" ? "md:justify-center" :
    pos === "right"  ? "md:justify-end" :
                       "md:justify-start";
  const innerMargin =
    pos === "center" ? "mx-auto" :
    pos === "right"  ? "mx-auto md:mx-0 md:ml-auto" :
                       "mx-auto md:mx-0 md:mr-auto";
  const headingAlign =
    pos === "center" ? "md:text-center" :
    pos === "right"  ? "md:text-right" :
                       "md:text-left";

  // Pozadina kao <picture> sa responzivnim verzijama (next/image optimizer) umesto
  // CSS background-image, koji uvek skida original — na telefonu je ovo LCP slika.
  const bgCommon = { alt: "", fill: true, sizes: "100vw", fetchPriority: "high", loading: "eager" };
  const { props: { srcSet: bgDesktopSrcSet } } = getImageProps({ ...bgCommon, src: bgImageUrl });
  const { props: bgMobileProps } = getImageProps({ ...bgCommon, src: bgImageUrlMobile });

  const TitleTag = calendarTitle ? "h1" : "div";

  return (
    <>

      {/* Preload hero pozadine (samo verzija za dati ekran) — browser je inače otkriva tek pri layout-u */}
      <link rel="preload" as="image" imageSrcSet={bgDesktopSrcSet} imageSizes="100vw" media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" imageSrcSet={bgMobileProps.srcSet} imageSizes="100vw" media="(max-width: 767px)" fetchPriority="high" />

      <div className="min-h-[100dvh] flex flex-col overflow-hidden">
        {/* TOP HEADER BAR — samo kad je logo uključen u adminu */}
        {showLogo && (
          <header
            className={
              theme === "football"
                ? "absolute inset-x-0 top-0 z-20 flex items-center justify-center px-4 py-6 md:py-7"
                : "w-full bg-[linear-gradient(90deg,#A6080E_0%,#D11101_100%)] px-4 md:px-16 py-2 flex items-center justify-between shrink-0"
            }
          >
            <a
              href={MAIN_SITE_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Meridianbet Calendar main site"
            >
              <Image
                src={logoUrl}
                alt="Meridianbet"
                width={0}
                height={0}
                priority
                sizes={theme === "football" ? "(min-width: 768px) 180px, 145px" : "(min-width: 768px) 115px, 90px"}
                className={theme === "football" ? "h-8 md:h-10 w-auto" : "h-5 md:h-[25px] w-auto"}
              />
            </a>
          </header>
        )}

        <main
          className={`relative z-0 w-full flex-1 overflow-hidden md:overflow-auto flex justify-center ${mainJustify}`}
        >
          {/* BACKGROUND — desktop/mobile verzija preko <source media> */}
          <picture>
            <source media="(min-width: 768px)" srcSet={bgDesktopSrcSet} sizes="100vw" />
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img {...bgMobileProps} className="pointer-events-none object-cover object-center -z-10 calendar-mobile-bg" />
          </picture>

          <SnowOverlay />

          {isClosed && !isAdmin ? (
            // Kalendar zatvoren (Calendar Styling → Calendar status): bez dana, klikova i popup-a
            <CalendarClosed
              {...closedInfo}
              countdownTargetIso={countdownTargetIso} countdownLabel={countdownLabel}
            />
          ) : (
          <div
            className={`relative z-10 w-full max-w-6xl px-4 sm:px-6 md:px-10 lg:px-16 pt-4 pb-4 md:pt-6 md:pb-10 ${innerMargin}`}
          >
            {/* Bez naslova ostaje prazan red iste visine — kalendar se ne pomera kad se naslov doda/ukloni */}
            <TitleTag
              aria-hidden={calendarTitle ? undefined : true}
              className={`${
                theme === "football"
                  ? `text-[28px] md:text-[44px] font-black tracking-[0.06em] ${exo2Black.className}`
                  : "text-3xl md:text-5xl font-extrabold tracking-tight"
              } text-white text-center ${headingAlign} ${
                theme === "football" ? "mt-10 mb-4 [@media(min-height:800px)]:mb-10 md:mt-10 md:mb-10" : "my-[30px]"
              }`}
            >
              {calendarTitle || "\u00A0"}
            </TitleTag>

            <CountdownTimer targetIso={countdownTargetIso} label={countdownLabel} />

            {isAdmin && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded bg-amber-500/20 text-amber-200 px-3 py-1 text-sm">
                  <span>Admin preview</span>
                  <a
                    href="/admin"
                    className="underline hover:text-white transition-colors"
                    title="Go to dashboard"
                  >
                    Dashboard
                  </a>
                  <AdminLogoutButton />
                </div>
                {isClosed && (
                  <div className="inline-flex items-center gap-1.5 rounded bg-red-700/40 text-red-200 border border-red-500/40 px-3 py-1 text-sm">
                    <span>{UI.calendarClosedAdmin}</span>
                    <Link href="/admin/calendar-style" className="underline hover:text-white transition-colors">
                      Izmeni
                    </Link>
                  </div>
                )}
                {isMonthInactive && (
                  <div className="inline-flex items-center gap-1.5 rounded bg-red-700/40 text-red-200 border border-red-500/40 px-3 py-1 text-sm">
                    <span>{UI.monthInactive}</span>
                    <a
                      href="/admin/calendar-style"
                      className="underline hover:text-white transition-colors"
                    >
                      Izmeni
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* MOBILE PAGINATION — skriva se za football temu (paginacija je unutar CalendarMobileFootball) */}
            {theme !== "football" && (
              <div className="mt-6 flex items-center justify-center md:hidden">
                <MonthPagination
                  year={year}
                  month={month}
                  prevMonth={prevMonth}
                  nextMonth={nextMonth}
                  className="text-sm"
                />
              </div>
            )}

            <div
              className={`${theme === "football" ? "mt-2 md:mt-1" : "mt-6"}${
                topOffset ? " md:[padding-top:var(--cal-top-offset)]" : ""
              }${topOffsetMobile ? " max-md:[padding-top:var(--cal-top-offset-m)]" : ""}`}
              style={{
                ...(topOffset && { "--cal-top-offset": `${topOffset}vh` }),
                ...(topOffsetMobile && { "--cal-top-offset-m": `${topOffsetMobile}svh` }),
              }}
            >
              <CalendarGrid
                year={year}
                month={month}
                weekly={weekly}
                specials={specials}
                adminPreview={isAdmin}
                lang={lang}
                theme={theme}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                today={today}
                openDay={openDay}
                dayFrom={dayFrom}
                dayTo={dayTo}
                confetti={confetti}
              />
            </div>

            <CalendarEnhancer adminPreview={isAdmin} lang={lang} openDay={openDay} />

            {/* DESKTOP PAGINATION */}
            <div className={`hidden md:flex items-center justify-center ${theme === "football" ? "mt-4" : ""}`}>
              <MonthPagination
                year={year}
                month={month}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                className="text-base"
                labelClassName={theme === "football" ? bebasNeue.className : ""}
              />
            </div>
          </div>
          )}
        </main>
      </div>
    </>
  );
}
