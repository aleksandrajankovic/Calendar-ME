"use client";

import AdminTableCard from "../../components/AdminTableCard";

export default function EngagementTab({
  countdownTargetIso, setCountdownTargetIso,
  countdownLabel, setCountdownLabel,
}) {
  return (
    <div className="space-y-6">
      <AdminTableCard title="Countdown Timer">
        <div className="p-4 space-y-4">
          <p className="text-sm text-neutral-500">
            Shown above the calendar until the target time. Leave the date empty to hide it.
          </p>
          <label className="block">
            <span className="mb-1 inline-block text-sm text-neutral-600">Target date and time</span>
            <input
              type="datetime-local"
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-2 text-sm"
              value={countdownTargetIso}
              onChange={(e) => setCountdownTargetIso(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 inline-block text-sm text-neutral-600">Label</span>
            <input
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-2 text-sm"
              value={countdownLabel}
              onChange={(e) => setCountdownLabel(e.target.value)}
              placeholder="Kalendar se otvara za"
            />
          </label>
        </div>
      </AdminTableCard>
    </div>
  );
}
