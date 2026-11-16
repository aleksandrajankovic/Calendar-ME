// components/CalendarEnhancer.js (CLIENT COMPONENT)
"use client";

import { useEffect } from "react";
import { initCalendarInteractions } from "@/lib/calendar/calendarInteractions";

export default function CalendarEnhancer({ openDay, adminPreview = false } = {}) {
  useEffect(() => {
    initCalendarInteractions("#calendar-root", { openDay, adminPreview });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
