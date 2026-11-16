// src/components/calendar/CalendarClosed.js
// Šta posetilac vidi kad je kalendar zatvoren (Calendar Styling → Calendar Status):
// pozadina kampanje ostaje cela, na sredini veliki naslov i žuto dugme ka svim promocijama.
// Bez dana, promocija i klikova po kalendaru.
import { rowdies } from "@/app/fonts";
import CountdownTimer from "./CountdownTimer";

export default function CalendarClosed({ title, buttonLabel, buttonLink, countdownTargetIso, countdownLabel }) {
  return (
    <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-10 min-h-[80dvh] text-center">
      <h1
        className={`${rowdies.className} max-w-xl text-[34px] leading-[1.1] text-white text-balance md:text-[56px]`}
        style={{ textShadow: "0 4px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {title}
      </h1>

      {buttonLabel && buttonLink && (
        <a
          href={buttonLink}
          target="_top"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-w-[260px] items-center justify-center rounded-[10px] bg-[#FACC01] px-8 py-4 text-sm font-bold uppercase tracking-wide text-black shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition hover:brightness-110 md:text-base"
        >
          {buttonLabel}
        </a>
      )}

      <div className="mt-8 empty:hidden">
        <CountdownTimer targetIso={countdownTargetIso} label={countdownLabel} />
      </div>
    </div>
  );
}
