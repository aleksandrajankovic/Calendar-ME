"use client";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { isValidLink } from "@/lib/validate";
import {
  ButtonColorPicker,
  DescriptionField,
  EditorShell,
  EffectToggles,
  IconField,
  LinkField,
  PillSelector,
  Section,
  TextField,
  openCalendarPreview,
  useDirty,
} from "../../components/PromoEditorFields";

// kategorije za promo
const CATEGORIES = [
  { value: "SPORT", label: "Sport" },
  { value: "CASINO", label: "Casino" },
  { value: "MISSIONS", label: "Missions" },
  { value: "ALL", label: "All" },
  { value: "GOLD", label: "Zlatna lopta" },
];

const KNOCKOUT_OPTIONS = [
  { value: null, label: "Nema" },
  { value: "QUARTER_FINAL", label: "⚽ Četvrtfinale (1/4)" },
  { value: "SEMI_FINAL", label: "⚽ Polufinale (1/2)" },
  { value: "FINAL", label: "🏆 Finale" },
];

// yyyy-mm-dd ⇄ {year, month(0-11), day}
function ymdFromDateInput(v) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function dateInputFromYMD({ year, month, day }) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function SpecialEditor({ initial, onCancel, onSaved }) {
  const seed = useMemo(() => {
    const now = new Date();
    const y = initial?.year ?? now.getFullYear();
    const m = initial?.month ?? now.getMonth(); // 0..11
    const d = initial?.day ?? now.getDate();

    const baseTranslations = initial?.translations || {};

    if (!baseTranslations["sr"]) {
      baseTranslations["sr"] = {
        title: initial?.title ?? "",
        button: initial?.button ?? "",
        rich: initial?.rich ?? null,
        richHtml: initial?.richHtml ?? "",
        link: initial?.link ?? "",
      };
    }

    return {
      id: initial?.id ?? null,
      year: y,
      month: m,
      day: d,
      dateStr: dateInputFromYMD({ year: y, month: m, day: d }),

      icon: initial?.icon ?? "",
      active: initial?.active ?? true,
      scratch: !!initial?.scratch,
      slot: !!initial?.slot,
      flipCard: !!initial?.flipCard,
      buttonColor: initial?.buttonColor ?? "green",

      translations: baseTranslations,

      category: initial?.category || "ALL",
      knockoutPhase: initial?.knockoutPhase || null,
    };
  }, [initial]);

  const [form, setForm] = useState(seed);
  const [saving, setSaving] = useState(false);
  const activeLang = "sr";

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  function setTranslationField(lang, key, value) {
    setForm((prev) => {
      const prevTranslations = prev.translations || {};
      const prevLangObj = prevTranslations[lang] || {};
      return {
        ...prev,
        translations: {
          ...prevTranslations,
          [lang]: {
            ...prevLangObj,
            [key]: value,
          },
        },
      };
    });
  }

  const dirty = useDirty(seed, form);

  async function save() {
    const currentT = form.translations?.[activeLang] || {};

    if (!currentT.title?.trim()) {
      toast.error("Title is required for the active language.");
      return;
    }
    if (!currentT.richHtml?.trim()) {
      toast.error("Content is required for the active language.");
      return;
    }
    if (!isValidLink(currentT.link)) {
      toast.error("Button link must start with https://, http:// or /.");
      return;
    }

    const dt = new Date(Date.UTC(form.year, form.month, form.day));
    const valid =
      dt.getUTCFullYear() === Number(form.year) &&
      dt.getUTCMonth() === Number(form.month) &&
      dt.getUTCDate() === Number(form.day);
    if (!valid) {
      toast.error("Invalid date.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!form.id;
      const url = isEdit ? `/api/special/${form.id}` : `/api/special`;
      const method = isEdit ? "PUT" : "POST";

      const translations = form.translations || {};
      const mainT = translations[activeLang] || {};
      const mainLink = mainT.link || form.link || "";

      const payload = {
        year: form.year,
        month: form.month,
        day: form.day,

        icon: form.icon,
        link: mainLink,

        active: !!form.active,
        scratch: !!form.scratch,
        slot: !!form.slot,
        flipCard: !!form.flipCard,
        buttonColor: form.buttonColor || "green",

        translations,
        defaultLang: activeLang,

        title: mainT.title || "",
        button: mainT.button || "",
        rich: mainT.rich || null,
        richHtml: mainT.richHtml || "",
        category: form.category || "ALL",
        knockoutPhase: form.knockoutPhase || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();

      toast.success(isEdit ? "Success!" : "Created!");
      onSaved(saved);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const currentT = form.translations?.[activeLang] || {};

  function onDateChange(v) {
    const ymd = ymdFromDateInput(v);
    setForm((prev) => (ymd ? { ...prev, dateStr: v, ...ymd } : { ...prev, dateStr: v }));
  }

  return (
    <EditorShell
      heading={
        <div className="text-base font-semibold text-neutral-900">
          {form.id
            ? "Edit Special Promotion"
            : initial?.duplicateOf
              ? `Duplicate of “${initial.duplicateOf}”`
              : "New Special Promotion"}
        </div>
      }
      active={form.active}
      onToggleActive={() => set("active", !form.active)}
      onPreview={() => openCalendarPreview(form.year, form.month)}
      onCancel={onCancel}
      onSave={save}
      saving={saving}
      dirty={dirty}
    >
      <Section title="Content">
        <div className="grid md:grid-cols-[minmax(0,1fr)_200px] gap-4">
          <TextField
            label="Title"
            value={currentT.title}
            onChange={(v) => setTranslationField(activeLang, "title", v)}
          />
          <label className="block text-sm text-neutral-800">
            <span className="mb-1 inline-block">Date</span>
            <input
              type="date"
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-1.5 text-sm"
              value={form.dateStr}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </label>
        </div>

        <DescriptionField
          label="Description"
          activeLang={activeLang}
          currentT={currentT}
          setTranslationField={setTranslationField}
        />
      </Section>

      <Section title="Button">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-start">
          <TextField
            label="Label"
            value={currentT.button}
            onChange={(v) => setTranslationField(activeLang, "button", v)}
          />
          <LinkField
            label="Link"
            value={currentT.link}
            onChange={(v) => setTranslationField(activeLang, "link", v)}
          />
          <ButtonColorPicker value={form.buttonColor} onChange={(v) => set("buttonColor", v)} />
        </div>
      </Section>

      <Section title="Appearance">
        <IconField value={form.icon} onChange={(v) => set("icon", v)} />
        <PillSelector label="Category" options={CATEGORIES} value={form.category} onChange={(v) => set("category", v)} />
        <PillSelector
          label={
            <>
              Knockout faza <span className="text-neutral-400 font-normal">(kombinuje se sa kategorijom)</span>
            </>
          }
          options={KNOCKOUT_OPTIONS}
          value={form.knockoutPhase || null}
          onChange={(v) => set("knockoutPhase", v)}
        />
      </Section>

      <Section title="Effects">
        <EffectToggles form={form} setField={set} />
      </Section>
    </EditorShell>
  );
}
