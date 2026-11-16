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
  WEEKDAY_LABELS,
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
  { value: "QUARTER_FINAL", label: "⚽ Četvrtfinale (1/4)" },
  { value: "SEMI_FINAL", label: "⚽ Polufinale (1/2)" },
  { value: "FINAL", label: "🏆 Finale" },
];

export default function WeeklyEditor({ initial, onCancel, onSave }) {
  const seed = useMemo(() => {
    const baseTranslations = initial?.translations || {};

    if (!baseTranslations["sr"]) {
      baseTranslations["sr"] = {
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
      slot: !!initial?.slot,
      flipCard: !!initial?.flipCard,
      translations: baseTranslations,
      buttonColor: initial?.buttonColor || "green",
      category: initial?.category || "ALL",
    };
  }, [initial]);

  const [form, setForm] = useState(seed);
  const [saving, setSaving] = useState(false);
  const activeLang = "sr";

  const dirty = useDirty(seed, form);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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


  async function save() {
    const currentT = form.translations?.[activeLang] || {};

    if (!currentT.title?.trim()) {
      toast.error("Title is required for active language.");
      return;
    }

    if (!currentT.richHtml?.trim()) {
      toast.error("Description is required for active language.");
      return;
    }
    if (!isValidLink(currentT.link)) {
      toast.error("Button link must start with https://, http:// or /.");
      return;
    }

    setSaving(true);
    try {
      const translations = form.translations || {};
      const mainT = translations[activeLang] || {};
      const mainLink = mainT.link || form.link || "";

      await onSave({
        weekday: form.weekday,

        // lokalizovani sadržaj (defaultLang = aktivni tab)
        translations,
        defaultLang: activeLang,

        title: mainT.title || "",
        button: mainT.button || "",
        link: mainLink,
        rich: mainT.rich || null,
        richHtml: mainT.richHtml || "",

        scratch: !!form.scratch,
        slot: !!form.slot,
        flipCard: !!form.flipCard,
        subtitle: form.subtitle ?? "",
        image: form.image ?? "",
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

  const dayLabel = WEEKDAY_LABELS[form.weekday] || "";
  const currentT = form.translations?.[activeLang] || {};

  return (
    <EditorShell
      heading={
        <>
          <div className="text-sm text-neutral-600">Edit:</div>
          <div className="text-base font-semibold text-neutral-900">{dayLabel}</div>
        </>
      }
      active={form.active}
      onToggleActive={() => setField("active", !form.active)}
      onPreview={() => openCalendarPreview(form.year, form.month)}
      onCancel={onCancel}
      onSave={save}
      saving={saving}
      dirty={dirty}
    >

      <Section title="Content">
        <TextField
          label="Title"
          value={currentT.title}
          onChange={(v) => setTranslationField(activeLang, "title", v)}
        />
        <DescriptionField
          label="Description"
          activeLang={activeLang}
          currentT={currentT}
          setTranslationField={setTranslationField}
          placeholder="Upiši sadržaj za ovu nedjeljnu promociju…"
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
          <ButtonColorPicker value={form.buttonColor} onChange={(v) => setField("buttonColor", v)} />
        </div>
      </Section>

      <Section title="Appearance">
        <IconField value={form.icon} onChange={(v) => setField("icon", v)} />
        <PillSelector label="Category" options={CATEGORIES} value={form.category} onChange={(v) => setField("category", v)} />
      </Section>

      <Section title="Effects">
        <EffectToggles form={form} setField={setField} />
      </Section>
    </EditorShell>
  );
}
