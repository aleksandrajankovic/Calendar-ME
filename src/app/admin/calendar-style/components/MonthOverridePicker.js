"use client";
// Izbor meseca za "Override for {mesec}" sekcije — deli se između tabova Calendar Styling stranice

import { MONTH_NAMES } from "./constants";

export default function MonthOverridePicker({ selYear, setSelYear, selMonth, setSelMonth, hasOverrides, onClear, sections }) {
  const now = new Date();
  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <p className="text-sm font-medium text-neutral-800 mb-2">Month overrides apply to:</p>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
          value={selMonth}
          onChange={(e) => setSelMonth(Number(e.target.value))}
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          className="w-24 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
          value={selYear}
          min={2024}
          max={now.getFullYear() + 2}
          onChange={(e) => setSelYear(Number(e.target.value))}
        />
        {hasOverrides && onClear && (
          <button type="button" onClick={onClear} className="text-xs text-red-500 hover:text-red-700 underline">
            Clear all overrides for {monthLabel}
          </button>
        )}
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        Every &quot;Override for {monthLabel}&quot; section ({sections}) applies to this month. The month is shared
        between tabs.
      </p>
    </div>
  );
}
