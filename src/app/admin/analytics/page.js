"use client";

import { useEffect, useState } from "react";
import AdminTableCard from "../components/AdminTableCard";

import { TIME_ZONE, NUMBER_LOCALE } from "@/lib/market";
const pad = (n) => String(n).padStart(2, "0");

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function pct(part, whole) {
  return whole ? `${Math.round((part / whole) * 100)}%` : "–";
}

const DEVICE_LABEL = { mobile: "Mobile", desktop: "Desktop" };

export default function AnalyticsPage() {
  const [from, setFrom] = useState(() => `${todayIso().slice(0, 7)}-01`);
  const [to, setTo] = useState(todayIso);
  // rezultat pamti za koji period je učitan — dok se ne poklopi sa izabranim, prikazuje se "Loading…"
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const key = `${from}|${to}`;
  const loading = result.key !== key;
  const data = result.data;
  const error = loading ? "" : result.error;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/analytics?from=${from}&to=${to}`)
      .then((r) => {
        if (r.status === 403) throw new Error("Only super admins can see analytics.");
        if (!r.ok) throw new Error("Failed to load analytics.");
        return r.json();
      })
      .then((d) => !cancelled && setResult({ key: `${from}|${to}`, data: d, error: "" }))
      .catch((e) => !cancelled && setResult({ key: `${from}|${to}`, data: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const t = data?.totals;
  const exportHref = (kind) => `/api/admin/analytics/export?kind=${kind}&from=${from}&to=${to}`;

  const stats = t
    ? [
        { label: "Views", value: t.views },
        { label: "Visitors", value: t.visitors, hint: "unique per day" },
        { label: "Days opened", value: t.opens },
        { label: "Revealed", value: t.scratches, hint: "scratch card or slot" },
        { label: "Button clicks", value: t.ctas, hint: `${pct(t.ctas, t.opens)} of opened` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Analytics</h1>
          <p className="text-sm text-neutral-500">
            Calendar views and clicks. Admin preview is not counted. Visible to super admins only.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1 text-neutral-600">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => e.target.value && setFrom(e.target.value)}
              className="border border-[#D0D0D0] rounded px-2.5 py-1.5 bg-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-neutral-600">
            To
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => e.target.value && setTo(e.target.value)}
              className="border border-[#D0D0D0] rounded px-2.5 py-1.5 bg-white"
            />
          </label>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {!error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-lg border border-neutral-200 shadow-sm px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{s.label}</div>
                <div className="text-2xl font-semibold text-neutral-900 tabular-nums">{s.value.toLocaleString(NUMBER_LOCALE)}</div>
                {s.hint && <div className="text-xs text-neutral-400">{s.hint}</div>}
              </div>
            ))}
            {loading && !t && <div className="col-span-full text-sm text-neutral-500">Loading…</div>}
          </div>

          {data?.byDevice?.length > 0 && (
            <p className="text-sm text-neutral-600">
              Views by device:{" "}
              {data.byDevice
                .map((d) => `${DEVICE_LABEL[d.device] || d.device}${d.embedded ? " (on betting site)" : " (direct)"} ${d.views}`)
                .join(" · ")}
            </p>
          )}

          <AdminTableCard
            title="By calendar day"
            headerRight={<ExportLink href={exportHref("promos")} />}
            columns={[
              { label: "Day", width: "110px" },
              { label: "Promotion", width: "1fr" },
              { label: "Opened", width: "90px", className: "text-right" },
              { label: "Unique", width: "90px", className: "text-right" },
              { label: "Revealed", width: "90px", className: "text-right" },
              { label: "Clicks", width: "90px", className: "text-right" },
              { label: "Click rate", width: "90px", className: "text-right" },
            ]}
          >
            <Rows
              rows={data?.byPromo}
              loading={loading}
              cols="110px 1fr 90px 90px 90px 90px 90px"
              textCols={2}
              render={(r) => [
                `${pad(r.day)}.${pad(r.month + 1)}.${r.year}`,
                r.title || "—",
                r.opens,
                r.openVisitors,
                r.scratches,
                r.ctas,
                pct(r.ctas, r.opens),
              ]}
            />
          </AdminTableCard>

          <AdminTableCard
            title="By date"
            headerRight={
              <>
                <ExportLink href={exportHref("daily")} />
                <ExportLink href={exportHref("events")} label="Export all events" />
              </>
            }
            columns={[
              { label: "Date", width: "110px" },
              { label: "Views", width: "1fr", className: "text-right" },
              { label: "Visitors", width: "1fr", className: "text-right" },
              { label: "Opened", width: "1fr", className: "text-right" },
              { label: "Revealed", width: "1fr", className: "text-right" },
              { label: "Clicks", width: "1fr", className: "text-right" },
            ]}
          >
            <Rows
              rows={data?.byDate}
              loading={loading}
              cols="110px 1fr 1fr 1fr 1fr 1fr"
              textCols={1}
              render={(r) => [
                r.date.split("-").reverse().join("."),
                r.views,
                r.visitors,
                r.opens,
                r.scratches,
                r.ctas,
              ]}
            />
          </AdminTableCard>
        </>
      )}
    </div>
  );
}

function ExportLink({ href, label = "Export CSV" }) {
  return (
    <a href={href} className="rounded bg-white/15 hover:bg-white/25 px-3 py-1 text-sm">
      {label}
    </a>
  );
}

// textCols: koliko prvih kolona je tekst (levo); ostale su brojevi (desno)
function Rows({ rows, loading, cols, textCols, render }) {
  if (!rows?.length) {
    return (
      <div className="px-4 py-6 text-sm text-neutral-500">{loading ? "Loading…" : "No data for this period."}</div>
    );
  }
  return rows.map((r, i) => (
    <div
      key={i}
      className="grid gap-3 px-4 py-2 text-sm border-t border-neutral-100 tabular-nums"
      style={{ gridTemplateColumns: cols }}
    >
      {render(r).map((v, j) => (
        <div key={j} className={j < textCols ? "truncate" : "text-right"}>
          {v}
        </div>
      ))}
    </div>
  ));
}
