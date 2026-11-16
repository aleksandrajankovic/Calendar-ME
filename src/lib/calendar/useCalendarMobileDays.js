"use client";

import { useState } from "react";

const GHOST_COUNT = 4;

function buildGhostDays(year, month) {
  if (typeof year !== "number" || typeof month !== "number") return [];

  const prevLastDate = new Date(year, month, 0);
  const prevMonthDays = prevLastDate.getDate();
  const prevMonthIndex = prevLastDate.getMonth();
  const prevYear = prevLastDate.getFullYear();

  const start = Math.max(1, prevMonthDays - GHOST_COUNT + 1);
  const ghostDays = [];
  for (let dayNum = start; dayNum <= prevMonthDays; dayNum++) {
    ghostDays.push({
      day: dayNum,
      year: prevYear,
      month: prevMonthIndex,
      hasPromo: false,
      isFutureForUx: false,
      isLocked: true,
      category: "ALL",
      icon: null,
      isGhost: true,
      isToday: false,
    });
  }
  return ghostDays;
}

function pickInitialIndex(days) {
  let i = days.findIndex((d) => d.isToday);
  if (i === -1) i = days.findIndex((d) => d.hasPromo);
  return i === -1 ? 0 : i;
}

// Dani tekućeg meseca stižu sa servera (CalendarGrid) kao prop, pa se kartice
// renderuju već u HTML-u (brži LCP). Dodaje "ghost" dane s kraja prethodnog meseca
// i bira početni aktivni dan (danas, ili prvi dan s promocijom). Deljeno između
// mobilnih kartica (Stack/Vertical varijante); promena meseca remount-uje (key).
export function useCalendarMobileDays(initialDays = [], year = null, month = null) {
  const [days] = useState(() => [...buildGhostDays(year, month), ...initialDays]);
  const [activeIndex, setActiveIndex] = useState(() => pickInitialIndex(days));

  return { days, activeIndex, setActiveIndex, year, month };
}
