// src/components/CalendarMobileVertical.js — vertical card stack (swipe up/down)
"use client";

import { useState } from "react";
import { getCategoryGradient } from "@/lib/calendar/promoCategoryStyles";
import { rowdies } from "@/app/fonts";
import { useCalendarMobileDays } from "@/lib/calendar/useCalendarMobileDays";
import PromoIcon from "@/components/calendar/promo/PromoIcon";

export default function CalendarMobileVertical({ initialDays = [], year: yearProp = null, month: monthProp = null, adminPreview = false }) {
  const { days, activeIndex, setActiveIndex } = useCalendarMobileDays(initialDays, yearProp, monthProp);
  const [touchStartY, setTouchStartY] = useState(null);

  const goPrev = () => setActiveIndex((idx) => (idx > 0 ? idx - 1 : idx));
  const goNext = () => setActiveIndex((idx) => (idx < days.length - 1 ? idx + 1 : idx));

  const handleTouchStart = (e) => setTouchStartY(e.touches[0].clientY);

  const handleTouchEnd = (e) => {
    if (touchStartY == null) return;
    const delta = e.changedTouches[0].clientY - touchStartY;
    if (delta > 40) goPrev();
    else if (delta < -40) goNext();
    setTouchStartY(null);
  };

  if (!days.length) return null;

  const MAX_OFFSET = 4;
  const CARD_HEIGHT = 140;
  const CARD_GAP = 58;
  const STACK_HEIGHT = 560;
  const ACTIVE_Y = STACK_HEIGHT / 2 - CARD_HEIGHT / 2;

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative w-full max-w-[380px] overflow-hidden touch-none"
        style={{ height: STACK_HEIGHT }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {days.map((day, index) => {
          const offset = index - activeIndex;
          if (Math.abs(offset) > MAX_OFFSET) return null;

          const locked = day.isLocked && !adminPreview;
          const category = day.category || "ALL";
          const isGhost = Boolean(day.isGhost);
          const gradientClass = locked ? "bg-black" : getCategoryGradient(category);
          const isTodayActive = day.isToday && !isGhost;

          const translateY = ACTIVE_Y + offset * CARD_GAP;
          const scale = offset === 0 ? 1 : 1 - Math.min(Math.abs(offset), MAX_OFFSET) * 0.06;
          const zIndex = MAX_OFFSET - Math.abs(offset);
          const opacity = offset === 0 ? 1 : 0.9;

          return (
            <button
              key={`mobile-v-${index}-${day.day}`}
              data-day-button
              data-day={day.day}
              disabled={locked || isGhost}
              onClick={() => !isGhost && setActiveIndex(index)}
              className={`
                absolute top-0 left-1/2
                w-[92%] h-[140px]
                rounded-[18px] overflow-hidden
                ${isTodayActive
                  ? "border-2 border-[#FACC01] shadow-[0_0_20px_rgba(250,204,1,0.9)]"
                  : "border"}
                ${isGhost
                  ? "bg-[#000000D9] border-white/20 shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
                  : gradientClass}
                shadow-[0_18px_40px_rgba(0,0,0,0.7)]
                transition duration-300
                ${locked || isGhost ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}
              `}
              style={{
                transform: `translate(-50%, ${translateY}px) scale(${scale})`,
                zIndex,
                opacity,
              }}
            >
              <span
                className={`
                  ${rowdies.className}
                  absolute left-4 top-3
                  z-10 text-[64px] leading-[65px] font-bold
                  bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent
                `}
              >
                {day.day.toString().padStart(2, "0")}
              </span>

              {!isGhost && (
                !locked && day.hasPromo && day.icon ? (
                  <PromoIcon
                    src={day.icon}
                    sizes="180px"
                    priority={offset === 0}
                    className="absolute right-0 inset-y-0 h-full w-[50%] object-cover object-center"
                  />
                ) : locked ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black/35">
                      <img src="/img/lock.png" alt="" className="w-10 h-10 object-contain" loading="lazy" />
                    </div>
                  </div>
                ) : null
              )}

              {!isGhost && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-black/0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
