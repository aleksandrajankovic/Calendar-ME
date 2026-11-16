"use client";
// Zajednički delovi forme za promocije (specijalne i nedeljne) — dizajn kao na promo-platform BO:
// forma je panel sa desne strane (EditorShell), podeljena na sekcije Content / Button / Appearance / Effects.

import { useEffect, useState } from "react";
import RichEditor from "@/components/admin-shared/RichEditor";
import ImageGalleryModal from "./ImageGalleryModal";
import { monthHref } from "@/lib/calendar/calendarUrls";
import { isValidLink } from "@/lib/validate";
import { confirmDialog } from "./ui/ConfirmDialog";
import Button from "./ui/Button";

export const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function openCalendarPreview(year, month) {
  const y = year || new Date().getFullYear();
  const m = typeof month === "number" ? month : new Date().getMonth();
  window.open(monthHref(y, m), "_blank", "noopener,noreferrer");
}

// Da li se forma razlikuje od početnog stanja (za upozorenje pre zatvaranja)
export function useDirty(seed, form) {
  const [initial] = useState(() => JSON.stringify(seed));
  return JSON.stringify(form) !== initial;
}

export function EditorShell({ heading, active, onToggleActive, onPreview, onCancel, onSave, saving, dirty = false, children }) {
  async function requestClose() {
    if (dirty) {
      const ok = await confirmDialog({
        title: "Discard unsaved changes?",
        message: "Your changes in this editor will be lost.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        tone: "danger",
      });
      if (!ok) return;
    }
    onCancel();
  }

  // Esc zatvara panel (ali ne kad je otvoren drugi prozor iznad njega, npr. galerija ili potvrda)
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && document.querySelectorAll('[aria-modal="true"]').length === 1) requestClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Upozorenje pretraživača pri zatvaranju taba sa nesačuvanim izmenama
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" onClick={requestClose} />
      <div className="relative h-full w-full max-w-3xl overflow-y-auto bg-neutral-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-3">
          <div className="flex items-center gap-3">{heading}</div>

          <div className="flex items-center gap-3">
            <ActiveSwitch active={active} onToggle={onToggleActive} />
            <button
              type="button"
              onClick={onPreview}
              className="text-xs text-neutral-600 underline decoration-neutral-300 hover:text-neutral-900"
            >
              Preview ↗
            </button>
            <Button size="sm" variant="secondary" onClick={requestClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : dirty ? "Save •" : "Save"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-5">{children}</div>
      </div>
    </div>
  );
}

function ActiveSwitch({ active, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!active}
      onClick={onToggle}
      className="flex items-center gap-2 text-xs text-neutral-700"
      title="Inactive promotions are not shown on the calendar"
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          active ? "bg-admin-primary" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      {active ? "Active" : "Inactive"}
    </button>
  );
}

export function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function TextField({ label, value, onChange, placeholder, error, className = "" }) {
  return (
    <label className={`block text-sm text-neutral-800 ${className}`}>
      <span className="mb-1 inline-block">{label}</span>
      <input
        className={`w-full border rounded px-2.5 py-1.5 text-sm ${error ? "border-red-500" : "border-[#D0D0D0]"}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function LinkField({ label, value, onChange, className = "" }) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder="https://..."
      className={className}
      error={isValidLink(value) ? null : "Must start with https://, http:// or /"}
    />
  );
}

const BUTTON_COLOR_SWATCHES = [
  { value: "yellow", swatch: "bg-[#FFCB05]", check: "text-black", label: "Yellow button" },
  { value: "green", swatch: "bg-[#17BB00]", check: "text-white", label: "Green button" },
];

export function ButtonColorPicker({ value, onChange, className = "" }) {
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <span className="mb-1 inline-block text-sm text-neutral-800">Button Color</span>
      <div className="flex items-center gap-2">
        {BUTTON_COLOR_SWATCHES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${
              value === c.value ? "border-black" : "border-transparent"
            }`}
            aria-label={c.label}
          >
            <span className={`h-6 w-6 rounded-full ${c.swatch} flex items-center justify-center`}>
              {value === c.value && <span className={`${c.check} text-[10px] leading-none`}>✓</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PillSelector({ label, options, value, onChange }) {
  return (
    <div>
      <span className="mb-1 inline-block text-sm text-neutral-800">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                "px-3 py-1 rounded-full text-[11px] font-medium border transition " +
                (selected
                  ? "bg-admin-primary text-white border-admin-primary"
                  : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function IconField({ value, onChange }) {
  const [showGallery, setShowGallery] = useState(false);
  return (
    <div>
      <label className="block text-sm text-neutral-800">
        <span className="mb-1 inline-block">Icon</span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/promo-icon.webp"
          />
          <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setShowGallery(true)}>
            Choose from gallery
          </Button>
        </div>
        {value && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="icon preview" className="w-8 h-8 object-contain border border-neutral-200 rounded bg-white" />
            <code className="text-xs text-neutral-500 break-all">{value}</code>
          </div>
        )}
      </label>

      {showGallery && (
        <ImageGalleryModal
          onSelect={(url) => {
            onChange(url);
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

export function DescriptionField({ label, activeLang, currentT, setTranslationField, placeholder }) {
  return (
    <div>
      <span className="text-sm text-neutral-800 block mb-1.5">{label}</span>
      <div className="border border-[#D0D0D0] rounded">
        <RichEditor
          key={activeLang}
          initialJSON={currentT.rich || null}
          placeholder={placeholder}
          onChange={({ json, html }) => {
            setTranslationField(activeLang, "rich", json);
            setTranslationField(activeLang, "richHtml", html);
          }}
        />
      </div>
    </div>
  );
}

// Grebalica i slot se isključuju — uključivanje jednog gasi drugi. Flip kartica radi sama ili
// uz grebalicu (ogrebeš, pa okreneš), ali ne uz slot — slot ima svoj prelaz na promociju.
export function EffectToggles({ form, setField }) {
  function toggle(key, other, checked) {
    setField(key, checked);
    if (checked) setField(other, false);
    if (checked && key === "slot") setField("flipCard", false);
  }
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={!!form.scratch}
          onChange={(e) => toggle("scratch", "slot", e.target.checked)}
        />
        <span>
          Enable scratch card
          <span className="block text-xs text-neutral-400">The player scratches the cover to reveal the promotion.</span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={!!form.slot}
          onChange={(e) => toggle("slot", "scratch", e.target.checked)}
        />
        <span>
          Enable slot reveal
          <span className="block text-xs text-neutral-400">
            Three reels spin through this month&apos;s promotion images and stop on this one. Needs an image in the
            description (440×170).
          </span>
        </span>
      </label>
      <label className={`flex items-start gap-2 text-sm ${form.slot ? "text-neutral-400" : "text-neutral-800"}`}>
        <input
          type="checkbox"
          className="mt-0.5"
          checked={!!form.flipCard}
          disabled={!!form.slot}
          onChange={(e) => setField("flipCard", e.target.checked)}
        />
        <span>
          Enable flip card
          <span className="block text-xs text-neutral-400">
            {form.slot
              ? "Not available with the slot reveal."
              : "Shows the description image as a portrait card (360:430); a tap flips it to the details. Works on its own or after scratching."}
          </span>
        </span>
      </label>
    </div>
  );
}
