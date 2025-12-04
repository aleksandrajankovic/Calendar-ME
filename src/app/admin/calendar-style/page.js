// src/app/admin/calendar-style/page.jsx (ili gde već živi)
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminTableCard from "../components/AdminTableCard";
import ImageGalleryModal from "../components/ImageGalleryModal";

export default function CalendarStyleAdminPage() {
  const [bgUrl, setBgUrl] = useState("/img/bg-calendar.png");
  const [bgUrlMobile, setBgUrlMobile] = useState("/img/bg-calendar-mobile.png");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isMobilePicker, setIsMobilePicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/calendar-settings")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setBgUrl(data.bgImageUrl || "/img/bg-calendar.png");
        setBgUrlMobile(
          data.bgImageUrlMobile || "/img/bg-calendar-mobile.png"
        );
      })
      .catch(() => toast.error("Error!"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/calendar-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bgImageUrl: bgUrl,
          bgImageUrlMobile: bgUrlMobile,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBgUrl(data.bgImageUrl || "/img/bg-calendar.png");
      setBgUrlMobile(
        data.bgImageUrlMobile || "/img/bg-calendar-mobile.png"
      );
      toast.success("Calendar background updated.");
    } catch (e) {
      toast.error(`Error: ${e.message || "Saving failed."}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-2">
        <h1 className="text-xl font-semibold">
          Backoffice - Calendar Background
        </h1>
        <p className="text-sm text-neutral-500">
          Set desktop and mobile background images for the promo calendar.
        </p>
      </div>

      <AdminTableCard title="Calendar Background">
        {loading ? (
          <div className="p-4 text-sm">Loading…</div>
        ) : (
          <div className="p-4 space-y-6">
            {/* DESKTOP BG */}
            <div>
              <label className="block text-sm text-neutral-800 mb-1">
                Desktop background image URL
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
                  value={bgUrl}
                  onChange={(e) => setBgUrl(e.target.value)}
                  placeholder="/img/bg-calendar.png"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsMobilePicker(false);
                    setShowGallery(true);
                  }}
                  className="shrink-0 font-condensed inline-flex items-center justify-center px-4 py-[10px] rounded bg-[#1F2933] text-white text-xs hover:brightness-110 whitespace-nowrap"
                >
                  Choose from gallery
                </button>
              </div>
              <div className="mt-3 border border-neutral-200 rounded-lg overflow-hidden max-w-[600px] aspect-[16/9] bg-black/40">
                {bgUrl ? (
                  <img
                    src={bgUrl}
                    alt="calendar background preview desktop"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                    No background set
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE BG */}
            <div>
              <label className="block text-sm text-neutral-800 mb-1">
                Mobile background image URL
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
                  value={bgUrlMobile}
                  onChange={(e) => setBgUrlMobile(e.target.value)}
                  placeholder="/img/bg-calendar-mobile.png"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsMobilePicker(true);
                    setShowGallery(true);
                  }}
                  className="shrink-0 font-condensed inline-flex items-center justify-center px-4 py-[10px] rounded bg-[#1F2933] text-white text-xs hover:brightness-110 whitespace-nowrap"
                >
                  Choose from gallery
                </button>
              </div>
              <div className="mt-3 border border-neutral-200 rounded-lg overflow-hidden max-w-[320px] aspect-[9/16] bg-black/40">
                {bgUrlMobile ? (
                  <img
                    src={bgUrlMobile}
                    alt="calendar background preview mobile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                    No background set
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-[18px] py-[7px] rounded bg-[#17BB00] text-white text-xs font-condensed hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </AdminTableCard>

      {showGallery && (
        <ImageGalleryModal
          onSelect={(url) => {
            if (isMobilePicker) setBgUrlMobile(url);
            else setBgUrl(url);
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
