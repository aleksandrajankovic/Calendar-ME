"use client";
// Calendar Styling — jedna stranica sa tabovima (kao na promo-platform BO). Svaka sekcija ima
// globalnu vrednost i ispod "Override for {mesec}"; mesec se bira jednom, na vrhu taba.
// Zamenjuje ranije odvojene stranice Default Settings i Settings by Month (one sada preusmeravaju ovde).

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ImageGalleryModal from "../components/ImageGalleryModal";
import TabNav from "./components/TabNav";
import BrandingLayoutTab from "./components/BrandingLayoutTab";
import SeoTab from "./components/SeoTab";
import EngagementTab from "./components/EngagementTab";
import EffectsTab from "./components/EffectsTab";

const TABS = [
  { key: "branding", label: "Branding & Layout" },
  { key: "effects", label: "Effects" },
  { key: "seo", label: "SEO / Meta" },
  { key: "engagement", label: "Engagement" },
];

export default function CalendarStylePage() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState("branding");

  const [bgUrl, setBgUrl]                       = useState("");
  const [bgUrlMobile, setBgUrlMobile]           = useState("");
  const [calendarPosition, setCalendarPosition] = useState("left");
  const [titleSr, setTitleSr]                   = useState("PRAZNIČNE MISIJE");
  const [logoUrl, setLogoUrl]                   = useState("/img/meridianbet-ng.png");
  const [showLogo, setShowLogo]                 = useState(false);
  const [theme, setTheme]                       = useState("default");
  const [seoTitleSr, setSeoTitleSr]             = useState("");
  const [seoDescSr, setSeoDescSr]               = useState("");
  const [countdownTargetIso, setCountdownTargetIso] = useState("");
  const [countdownLabel, setCountdownLabel]         = useState("");
  const [confetti, setConfetti]                     = useState(null);
  const [closed, setClosed]                         = useState({ enabled: false });

  const [monthBackgrounds, setMonthBackgrounds] = useState({});
  const [selYear, setSelYear]   = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());

  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [showGallery, setShowGallery]     = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null);

  useEffect(() => {
    fetch("/api/calendar-settings")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(applySettings)
      .catch(() => toast.error("Error loading settings."))
      .finally(() => setLoading(false));
  }, []);

  function applySettings(d) {
    setBgUrl(d.bgImageUrl || "/img/bg-calendar.png");
    setBgUrlMobile(d.bgImageUrlMobile || "/img/bg-calendar-mobile.png");
    setCalendarPosition(d.calendarPosition || "left");
    setTitleSr(d.calendarTitle?.sr ?? "PRAZNIČNE MISIJE");
    setLogoUrl(d.logoUrl || "/img/meridianbet-ng.png");
    setShowLogo(!!d.showLogo);
    setTheme(d.theme || "default");
    setSeoTitleSr(d.seoMeta?.sr?.title || "");
    setSeoDescSr(d.seoMeta?.sr?.description || "");
    setCountdownTargetIso(d.countdownTargetIso || "");
    setCountdownLabel(d.countdownLabel || "");
    setConfetti(d.confetti || null);
    setClosed(d.closed || { enabled: false });
    setMonthBackgrounds(d.monthBackgrounds || {});
  }

  function openGallery(target) {
    setGalleryTarget(target);
    setShowGallery(true);
  }

  function handleGallerySelect(url) {
    if (galleryTarget === "desktop") setBgUrl(url);
    else if (galleryTarget === "mobile") setBgUrlMobile(url);
    else if (galleryTarget === "logo") setLogoUrl(url);
    else if (galleryTarget === "monthDesktop" || galleryTarget === "monthMobile") {
      const key = `${selYear}-${selMonth}`;
      const field = galleryTarget === "monthDesktop" ? "desktop" : "mobile";
      setMonthBackgrounds((prev) => ({ ...prev, [key]: { ...prev[key], [field]: url } }));
    }
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
          calendarPosition,
          calendarTitle: { sr: titleSr },
          logoUrl,
          showLogo,
          theme,
          seoMeta: { sr: { title: seoTitleSr, description: seoDescSr } },
          countdownTargetIso,
          countdownLabel,
          confetti,
          closed,
          monthBackgrounds,
        }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
      applySettings(await res.json());
      toast.success("Calendar style saved.");
    } catch (e) {
      toast.error(`Error: ${e.message || "Saving failed."}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Calendar Styling</h1>
        <p className="text-sm text-neutral-500">
          Global defaults apply to every month unless you set an override for a specific month.
        </p>
      </div>

      {loading ? (
        <div className="p-4 text-sm">Loading…</div>
      ) : (
        <>
          <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {activeTab === "branding" && (
            <BrandingLayoutTab
              logoUrl={logoUrl} setLogoUrl={setLogoUrl}
              showLogo={showLogo} setShowLogo={setShowLogo}
              closed={closed} setClosed={setClosed}
              titleSr={titleSr} setTitleSr={setTitleSr}
              theme={theme} setTheme={setTheme}
              calendarPosition={calendarPosition} setCalendarPosition={setCalendarPosition}
              bgUrl={bgUrl} setBgUrl={setBgUrl}
              bgUrlMobile={bgUrlMobile} setBgUrlMobile={setBgUrlMobile}
              monthBackgrounds={monthBackgrounds} setMonthBackgrounds={setMonthBackgrounds}
              selYear={selYear} setSelYear={setSelYear}
              selMonth={selMonth} setSelMonth={setSelMonth}
              openGallery={openGallery}
            />
          )}

          {activeTab === "effects" && (
            <EffectsTab
              confetti={confetti} setConfetti={setConfetti}
              monthBackgrounds={monthBackgrounds} setMonthBackgrounds={setMonthBackgrounds}
              selYear={selYear} setSelYear={setSelYear}
              selMonth={selMonth} setSelMonth={setSelMonth}
            />
          )}

          {activeTab === "seo" && (
            <SeoTab
              seoTitleSr={seoTitleSr} setSeoTitleSr={setSeoTitleSr}
              seoDescSr={seoDescSr} setSeoDescSr={setSeoDescSr}
            />
          )}

          {activeTab === "engagement" && (
            <EngagementTab
              countdownTargetIso={countdownTargetIso} setCountdownTargetIso={setCountdownTargetIso}
              countdownLabel={countdownLabel} setCountdownLabel={setCountdownLabel}
            />
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 px-[18px] py-[7px] rounded bg-[#17BB00] text-white text-xs font-condensed hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      )}

      {showGallery && (
        <ImageGalleryModal onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />
      )}
    </>
  );
}
