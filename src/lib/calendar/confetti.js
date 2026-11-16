// src/lib/calendar/confetti.js
// Konfete posle grebanja — stil se bira u adminu (Calendar Styling → Effects), globalno i po mesecu.
// Bez DOM zavisnosti, pa ga koriste i API (provera unosa) i kalendar (izbor stila).

export const CONFETTI_STYLES = [
  { value: "theme", label: "By theme", hint: "Football theme: balls, other themes: classic" },
  { value: "classic", label: "Classic", hint: "Colorful paper confetti" },
  { value: "football", label: "⚽ Football", emoji: ["⚽", "🟡"] },
  { value: "halloween", label: "🎃 Halloween", emoji: ["🎃", "🍬", "🍭", "👻", "🦇"] },
  { value: "christmas", label: "🎄 Christmas", emoji: ["❄️", "🎁", "⭐", "🎄", "🔔"] },
  { value: "custom", label: "Custom emoji" },
  { value: "off", label: "Off" },
];

const VALUES = new Set(CONFETTI_STYLES.map((s) => s.value));
const MAX_EMOJI = 8;

// "🎃 🍬👻" → ["🎃","🍬","👻"] — deli po grafemima, da emoji sa više delova (❄️, 👨‍👩‍👧) ostane ceo
export function splitEmoji(text = "") {
  const str = String(text).replace(/\s+/g, "");
  if (!str) return [];
  const parts =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(str)].map((s) => s.segment)
      : [...str];
  return parts.slice(0, MAX_EMOJI);
}

// Čišćenje unosa iz admina; vraća null kad nema podešavanja (nasleđuje se globalno / po temi)
export function sanitizeConfetti(raw) {
  if (!raw || typeof raw !== "object" || !VALUES.has(raw.style)) return null;
  if (raw.style !== "custom") return { style: raw.style };
  const emoji = splitEmoji(raw.emoji).join("");
  return emoji ? { style: "custom", emoji } : null;
}

// Mesečni override > globalno > po temi
export function resolveConfetti({ monthConfetti, globalConfetti, theme }) {
  const chosen = sanitizeConfetti(monthConfetti) || sanitizeConfetti(globalConfetti) || { style: "theme" };
  if (chosen.style !== "theme") return chosen;
  return { style: theme === "football" ? "football" : "classic" };
}

// Lista emoji-ja za stil (prvi se ponavlja, pa se pojavljuje najčešće); [] = klasične papirne konfete
export function confettiEmoji(confetti) {
  const list =
    confetti?.style === "custom"
      ? splitEmoji(confetti.emoji)
      : CONFETTI_STYLES.find((s) => s.value === confetti?.style)?.emoji || [];
  return list.length > 1 ? [list[0], list[0], ...list] : list;
}
