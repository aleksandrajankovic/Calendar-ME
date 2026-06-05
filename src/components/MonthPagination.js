// src/components/MonthPagination.js

export default function MonthPagination({
  year,
  month,
  prevMonth,
  nextMonth,
  className = "",
  labelClassName = "",
}) {
  const raw = new Date(year, month, 1).toLocaleString("sr-Latn-ME", { month: "long" });
  const monthLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div className={`inline-flex items-center gap-4 rounded-full bg-black/40 px-4 py-2 text-white ${className}`}>
      {prevMonth ? (
        <a href={`/?y=${prevMonth.y}&m=${prevMonth.m}`} className="p-1 hover:opacity-80" aria-label="Previous month">
          ‹
        </a>
      ) : (
        <span className="p-1 opacity-20 cursor-default" aria-hidden="true">‹</span>
      )}

      <span className={`min-w-[140px] text-center font-semibold ${labelClassName}`}>
        {monthLabel} <span className="ml-1 opacity-80">{year}</span>
      </span>

      {nextMonth ? (
        <a href={`/?y=${nextMonth.y}&m=${nextMonth.m}`} className="p-1 hover:opacity-80" aria-label="Next month">
          ›
        </a>
      ) : (
        <span className="p-1 opacity-20 cursor-default" aria-hidden="true">›</span>
      )}
    </div>
  );
}
