"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import RichEditor from "@/components/RichEditor";
import ImageGalleryModal from "../../components/ImageGalleryModal";

const LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const LANG = "sr";

const CATEGORIES = [
  { value: "SPORT", label: "Sport" },
  { value: "CASINO", label: "Casino" },
  { value: "MISSIONS", label: "Missions" },
  { value: "ALL", label: "All" },
];

export default function WeeklyEditor({ initial, onCancel, onSave }) {
  const seed = useMemo(() => {
    const baseTranslations = initial?.translations || {};
    if (!baseTranslations[LANG]) {
      baseTranslations[LANG] = {
        title: initial?.title ?? "",
        button: initial?.button ?? "",
        link: initial?.link ?? "",
        rich: initial?.rich ?? null,
        richHtml: initial?.richHtml ?? "",
      };
    }

    return {
      ...initial,
      scratch: !!initial?.scratch,
      translations: baseTranslations,
      buttonColor: initial?.buttonColor || "green",
      category: initial?.category || "ALL",
    };
  }, [initial]);

  const [form, setForm] = useState(seed);
  const [saving, setSaving] = useState(false);
  const [showIconGallery, setShowIconGallery] = useState(false);

  useEffect(() => { setForm(seed); }, [seed]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setTranslationField(key, value) {
    setForm((prev) => {
      const prevT = prev.translations || {};
      const prevL = prevT[LANG] || {};
      return { ...prev, translations: { ...prevT, [LANG]: { ...prevL, [key]: value } } };
    });
  }

  async function save() {
    const currentT = form.translations?.[LANG] || {};

    if (!currentT.title?.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!currentT.richHtml?.trim()) {
      toast.error("Description is required.");
      return;
    }

    setSaving(true);
    try {
      const translations = form.translations || {};
      const mainT = translations[LANG] || {};

      await onSave({
        weekday: form.weekday,
        translations,
        defaultLang: LANG,
        title: mainT.title || "",
        button: mainT.button || "",
        link: mainT.link || "",
        rich: mainT.rich || null,
        richHtml: mainT.richHtml || "",
        scratch: !!form.scratch,
        icon: form.icon ?? "",
        active: !!form.active,
        buttonColor: form.buttonColor ?? "green",
        category: form.category || "ALL",
      });

      toast.success("Saved.");
    } catch (e) {
      toast.error(`Error: ${e.message || "Saving failed."}`);
    } finally {
      setSaving(false);
    }
  }

  const dayLabel = LABELS[form.weekday] || "";
  const currentT = form.translations?.[LANG] || {};

  return (
    <>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="text-sm text-[#AC1C09] hover:underline">
            ← Back
          </button>
          <div className="text-sm text-neutral-600">Edit:</div>
          <div className="text-base font-semibold text-neutral-900">{dayLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-[18px] py-[7px] rounded bg-[#C43D2F] font-condensed text-white text-xs hover:brightness-110"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-[18px] py-[7px] rounded bg-[#17BB00] text-white text-xs font-condensed hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white border border-neutral-200 rounded-lg shadow-sm p-4 md:p-5 space-y-4">
        {/* Active toggle */}
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <button
            type="button"
            onClick={() => setField("active", !form.active)}
            className={`h-5 w-5 rounded-sm border flex items-center justify-center ${
              form.active ? "bg-[#17BB00] border-[#17BB00]" : "bg-white border-neutral-400"
            }`}
          >
            {form.active && (
              <span className="text-white text-xs leading-none">
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                  <path d="M11.2667 1L4.20833 8.05833L1 4.85" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
          <span className="text-[#989898] text-xs">Active</span>
        </label>

        {/* Scratch toggle */}
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={!!form.scratch}
            onChange={(e) => setField("scratch", e.target.checked)}
          />
          Enable scratch card
        </label>

        {/* Title */}
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm text-neutral-800">
            <span className="mb-1 inline-block">Title</span>
            <input
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
              value={currentT.title || ""}
              onChange={(e) => setTranslationField("title", e.target.value)}
            />
          </label>
        </div>

        {/* Button label + link + color */}
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-sm text-neutral-800 flex-1 min-w-[180px]">
            <span className="mb-1 inline-block">Button label</span>
            <input
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
              value={currentT.button || ""}
              onChange={(e) => setTranslationField("button", e.target.value)}
            />
          </label>

          <label className="block text-sm text-neutral-800 flex-1 min-w-[180px]">
            <span className="mb-1 inline-block">Button link</span>
            <input
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
              value={currentT.link || ""}
              onChange={(e) => setTranslationField("link", e.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="flex flex-col items-start w-32 shrink-0">
            <span className="mb-1 inline-block text-sm text-neutral-800">Button Color</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setField("buttonColor", "yellow")}
                className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${form.buttonColor === "yellow" ? "border-black" : "border-transparent"}`}
              >
                <span className="h-6 w-6 rounded-full bg-[#FFCB05] flex items-center justify-center">
                  {form.buttonColor === "yellow" && <span className="text-black text-[10px]">✓</span>}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setField("buttonColor", "green")}
                className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${form.buttonColor === "green" ? "border-black" : "border-transparent"}`}
              >
                <span className="h-6 w-6 rounded-full bg-[#31A62E] flex items-center justify-center">
                  {form.buttonColor === "green" && <span className="text-white text-[10px]">✓</span>}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="mt-2">
          <span className="mb-1 inline-block text-sm text-neutral-800">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const selected = form.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setField("category", cat.value)}
                  className={
                    "px-3 py-1 rounded-full text-[11px] font-medium border transition " +
                    (selected
                      ? "bg-[#17BB00] text-white border-[#17BB00]"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100")
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon */}
        <div className="mt-3">
          <label className="block text-sm text-neutral-800">
            <span className="mb-1 inline-block">Icon</span>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="flex-1 min-w-0 border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
                value={form.icon || ""}
                onChange={(e) => setField("icon", e.target.value)}
                placeholder="/uploads/promo-icon.webp"
              />
              <button
                type="button"
                onClick={() => setShowIconGallery(true)}
                className="shrink-0 font-condensed inline-flex items-center justify-center px-4 py-2.5 rounded bg-[#1F2933] text-white text-xs hover:brightness-110 whitespace-nowrap"
              >
                Choose from gallery
              </button>
            </div>
            {form.icon && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.icon} alt="icon preview" className="w-8 h-8 object-contain border border-neutral-200 rounded bg-white" />
                <code className="text-xs text-neutral-500 break-all">{form.icon}</code>
              </div>
            )}
          </label>
        </div>

        {showIconGallery && (
          <ImageGalleryModal
            onSelect={(url) => { setField("icon", url); setShowIconGallery(false); }}
            onClose={() => setShowIconGallery(false)}
          />
        )}

        {/* Rich text */}
        <div className="mt-2">
          <span className="text-sm text-neutral-800 block mb-1.5">Description</span>
          <div className="border border-[#D0D0D0] rounded">
            <RichEditor
              initialJSON={currentT.rich ?? null}
              placeholder="Enter content for this weekly promotion…"
              onChange={({ json, html }) => {
                setTranslationField("rich", json);
                setTranslationField("richHtml", html);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
