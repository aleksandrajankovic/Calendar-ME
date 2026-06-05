"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminTableCard from "../components/AdminTableCard";
import ImageGalleryModal from "../components/ImageGalleryModal";

const POSITION_OPTIONS = [
  { value: "left",   label: "Left" },
  { value: "center", label: "Center" },
  { value: "right",  label: "Right" },
];

export default function CalendarStyleAdminPage() {
  const [bgUrl, setBgUrl]                       = useState("/img/bg-calendar.png");
  const [bgUrlMobile, setBgUrlMobile]           = useState("/img/bg-calendar-mobile.png");
  const [theme, setTheme]                       = useState("default");
  const [logoUrl, setLogoUrl]                   = useState("/img/logo.svg");
  const [titleSr, setTitleSr]                   = useState("Proljećni Kalendar");
  const [calendarPosition, setCalendarPosition] = useState("left");
  const [loading, setLoading]                   = useState(true);
  const [saving, setSaving]                     = useState(false);
  const [showGallery, setShowGallery]           = useState(false);
  const [galleryTarget, setGalleryTarget]       = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/calendar-settings")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setBgUrl(data.bgImageUrl || "/img/bg-calendar.png");
        setBgUrlMobile(data.bgImageUrlMobile || "/img/bg-calendar-mobile.png");
        setTheme(data.theme || "default");
        setLogoUrl(data.logoUrl || "/img/logo.svg");
        setTitleSr(data.calendarTitle?.sr || "Proljećni Kalendar");
        setCalendarPosition(data.calendarPosition || "left");
      })
      .catch(() => toast.error("Error loading settings."))
      .finally(() => setLoading(false));
  }, []);

  function openGallery(target) {
    setGalleryTarget(target);
    setShowGallery(true);
  }

  function handleGallerySelect(url) {
    if (galleryTarget === "desktop") setBgUrl(url);
    else if (galleryTarget === "mobile") setBgUrlMobile(url);
    else if (galleryTarget === "logo") setLogoUrl(url);
    setShowGallery(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/calendar-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bgImageUrl: bgUrl,
          bgImageUrlMobile: bgUrlMobile,
          theme,
          logoUrl,
          calendarTitle: { sr: titleSr },
          calendarPosition,
        }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
      const data = await res.json();
      setBgUrl(data.bgImageUrl || "/img/bg-calendar.png");
      setBgUrlMobile(data.bgImageUrlMobile || "/img/bg-calendar-mobile.png");
      setTheme(data.theme || "default");
      setLogoUrl(data.logoUrl || "/img/logo.svg");
      setTitleSr(data.calendarTitle?.sr || "Proljećni Kalendar");
      setCalendarPosition(data.calendarPosition || "left");
      toast.success("Settings saved.");
    } catch (e) {
      toast.error(`Error: ${e.message || "Saving failed."}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Default Settings</h1>
        <p className="text-sm text-neutral-500">
          Global defaults applied to all months unless overridden in "Settings by Month".
        </p>
      </div>

      {loading ? (
        <div className="p-4 text-sm">Loading…</div>
      ) : (
        <div className="space-y-6">

          {/* ── LOGO ── */}
          <AdminTableCard title="Logo">
            <div className="p-4 space-y-4">
              <p className="text-sm text-neutral-500">Logo displayed in the top header bar.</p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/img/logo.svg"
                />
                <button
                  type="button"
                  onClick={() => openGallery("logo")}
                  className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded bg-[#1F2933] text-white text-xs hover:brightness-110 whitespace-nowrap"
                >
                  Choose from gallery
                </button>
              </div>
              {logoUrl && (
                <div className="mt-1 h-14 flex items-center bg-[#D11101] rounded-lg px-4 max-w-xs">
                  <img src={logoUrl} alt="logo preview" className="h-9 w-auto object-contain" />
                </div>
              )}
            </div>
          </AdminTableCard>

          {/* ── CALENDAR TITLE ── */}
          <AdminTableCard title="Calendar Title">
            <div className="p-4 space-y-4">
              <p className="text-sm text-neutral-500">Main heading shown above the calendar.</p>
              <input
                className="w-full border border-[#D0D0D0] rounded px-2.5 py-2 text-sm"
                value={titleSr}
                onChange={(e) => setTitleSr(e.target.value)}
                placeholder="Proljećni Kalendar"
              />
              {titleSr && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs text-neutral-400 mb-1">Preview:</p>
                  <p className="text-2xl font-extrabold tracking-tight text-neutral-800">{titleSr}</p>
                </div>
              )}
            </div>
          </AdminTableCard>

          {/* ── CALENDAR THEME ── */}
          <AdminTableCard title="Calendar Theme">
            <div className="p-4 space-y-4">
              <p className="text-sm text-neutral-500">
                Visual style for the calendar. Football shows balls instead of cards and removes the red header bar.
              </p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { value: "default", label: "Default (vertical)" },
                  { value: "default-horizontal", label: "Default (horizontal)" },
                  { value: "football", label: "⚽ Football" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={[
                      "px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                      theme === opt.value
                        ? "border-[#AC1C09] bg-red-50 text-[#AC1C09]"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </AdminTableCard>

          {/* ── CALENDAR POSITION ── */}
          <AdminTableCard title="Calendar Position">
            <div className="p-4 space-y-4">
              <p className="text-sm text-neutral-500">
                Desktop alignment of the calendar content. No effect on mobile.
              </p>
              <div className="flex gap-3 flex-wrap">
                {POSITION_OPTIONS.map((opt) => {
                  const active = calendarPosition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCalendarPosition(opt.value)}
                      className={[
                        "flex flex-col items-center gap-2 px-6 py-4 rounded-lg border-2 text-sm font-medium transition-colors",
                        active
                          ? "border-[#AC1C09] bg-red-50 text-[#AC1C09]"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      <span className="flex gap-0.5 items-end h-8" aria-hidden="true">
                        {opt.value === "left" && (
                          <>
                            <span className="w-8 h-full bg-current rounded-sm opacity-80" />
                            <span className="w-3 h-5 bg-current rounded-sm opacity-20" />
                            <span className="w-3 h-5 bg-current rounded-sm opacity-20" />
                          </>
                        )}
                        {opt.value === "center" && (
                          <>
                            <span className="w-3 h-5 bg-current rounded-sm opacity-20" />
                            <span className="w-8 h-full bg-current rounded-sm opacity-80" />
                            <span className="w-3 h-5 bg-current rounded-sm opacity-20" />
                          </>
                        )}
                        {opt.value === "right" && (
                          <>
                            <span className="w-3 h-5 bg-current rounded-sm opacity-20" />
                            <span className="w-3 h-5 bg-current rounded-sm opacity-20" />
                            <span className="w-8 h-full bg-current rounded-sm opacity-80" />
                          </>
                        )}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </AdminTableCard>

          {/* ── BACKGROUND IMAGES ── */}
          <AdminTableCard title="Background Image">
            <div className="p-4 space-y-6">
              <p className="text-sm text-neutral-500">Fallback background for all months unless overridden per month.</p>

              <div>
                <label className="block text-sm text-neutral-800 mb-1">Desktop</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
                    value={bgUrl}
                    onChange={(e) => setBgUrl(e.target.value)}
                    placeholder="/img/bg-calendar.png"
                  />
                  <button
                    type="button"
                    onClick={() => openGallery("desktop")}
                    className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded bg-[#1F2933] text-white text-xs hover:brightness-110 whitespace-nowrap"
                  >
                    Choose from gallery
                  </button>
                </div>
                <div className="mt-3 border border-neutral-200 rounded-lg overflow-hidden max-w-[600px] aspect-video bg-black/40">
                  {bgUrl
                    ? <img src={bgUrl} alt="desktop bg preview" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">No background set</div>
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-800 mb-1">Mobile</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
                    value={bgUrlMobile}
                    onChange={(e) => setBgUrlMobile(e.target.value)}
                    placeholder="/img/bg-calendar-mobile.png"
                  />
                  <button
                    type="button"
                    onClick={() => openGallery("mobile")}
                    className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded bg-[#1F2933] text-white text-xs hover:brightness-110 whitespace-nowrap"
                  >
                    Choose from gallery
                  </button>
                </div>
                <div className="mt-3 border border-neutral-200 rounded-lg overflow-hidden w-full max-w-[320px] aspect-9/16 bg-black/40">
                  {bgUrlMobile
                    ? <img src={bgUrlMobile} alt="mobile bg preview" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">No background set</div>
                  }
                </div>
              </div>
            </div>
          </AdminTableCard>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-[18px] py-[7px] rounded bg-[#17BB00] text-white text-xs font-condensed hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {showGallery && (
        <ImageGalleryModal
          onSelect={handleGallerySelect}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
