// src/lib/promoModalHtml.js
// Čisto renderovanje HTML-a za promo modal — bez DOM zavisnosti, pa radi
// identično i na serveru (SSR sadržaj za otvoreni dan) i na klijentu (klik).
import { extractFirstImg, flipHintText, renderFlipFaces, renderScratchModal } from "./scratch/renderScratchModal";
import { firstImage, renderSlotModal } from "./slot/slotReveal";
import { getExclusiveBadgeLabel } from "@/lib/calendar/promoCategoryStyles";
import { esc } from "./escapeHtml";

function renderNormalModal(entry, lang = "sr") {
  if (!entry) {
    return lang === "sr"
      ? "<p>Ne postoje promocije za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo } = entry;

  // obični tekstovi iz admina se escape-uju (vidi escapeHtml.js); richHtml je sanitizovan HTML
  const title = esc(entry.title || (promo && promo.title) || "");
  const button = esc(entry.button || (promo && promo.button) || "");
  const buttonColor =
    entry.buttonColor || (promo && promo.buttonColor) || "green";
  const link = entry.link || (promo && promo.link) || "";
  const richHtml = entry.richHtml || (promo && promo.richHtml) || "";

  if (!promo && !richHtml) {
    return lang === "sr"
      ? "<p>Ne postoje promocije za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  let imageHtml = null;
  let contentHtml = richHtml;

  if (contentHtml) {
    const imgMatch = contentHtml.match(/<img[^>]*>/i);
    if (imgMatch) {
      imageHtml = imgMatch[0]
        .replace(/\s+width="[^"]*"/gi, "")
        .replace(/\s+height="[^"]*"/gi, "")
        .replace(/\s+style="[^"]*"/gi, "");
      contentHtml = contentHtml.replace(imgMatch[0], "");
    }
  }

  const categoryLabel = getExclusiveBadgeLabel(entry?.category, lang);

  const openUrl = link && esc(link);
  const canOpen = openUrl && openUrl !== "#";
  const isYellow = buttonColor === "yellow";
  const defaultButtonLabel =
    button || (lang === "sr" ? "Registruj se" : "Register");

  return `
    <div class="flex flex-col w-full max-w-[420px] mx-auto">
      ${
        imageHtml
          ? `
        <div class="mb-4 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl">
          ${imageHtml}
        </div>`
          : ""
      }

      <h2 class="font-bold text-[24px] md:text-[28px] leading-tight mb-2 text-center text-white">
        ${title}
      </h2>
      <div class="text-[11px] uppercase tracking-[0.12em] text-[#FACC01] mb-3 text-center">
        ${categoryLabel}
      </div>

      ${
        contentHtml
          ? `
        <div class="
          text-sm leading-relaxed text-white/90
          [&_strong]:font-semibold [&_em]:italic [&_u]:underline
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:mb-0.5
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-2
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2
        ">
          ${contentHtml}
        </div>`
          : ""
      }

      ${
        canOpen
          ? `
        <div class="pt-5 mt-2 flex justify-center">
          <a
            href="${openUrl}"
            data-track="cta"
            target="_blank"
            rel="noopener noreferrer"
            class="
              w-4/5 max-w-[360px]
              inline-flex items-center justify-center
              px-4 py-3
              rounded-[10px]
              text-sm font-semibold font-condensed
              shadow-[0_10px_25px_rgba(0,0,0,0.6)]
              transition
              ${
                isYellow
                  ? "bg-[#FACC01] text-black hover:brightness-110"
                  : "bg-[#17BB00] text-white hover:brightness-110"
              }
            "
          >
            ${defaultButtonLabel}
          </a>
        </div>`
          : ""
      }
    </div>
  `;
}

const MONTHS_SR = [
  "januar", "februar", "mart", "april", "maj", "jun",
  "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Slot mašina: tri valjka vrte slike ostalih promocija meseca (entry.slotPool) i staju
// na sliku ove promocije, koja se zatim pretvara u običan prikaz promocije.
function renderSlot(entry, lang) {
  const richHtml = entry.richHtml || entry.promo?.richHtml || "";
  const image = firstImage(richHtml);
  const sr = lang === "sr";
  const dateLabel = sr
    ? `${entry.day}. ${MONTHS_SR[entry.month] || ""}`
    : `${MONTHS_EN[entry.month] || ""} ${entry.day}`;

  return renderSlotModal({
    image,
    icon: entry.icon || entry.promo?.icon || "",
    pool: entry.slotPool?.length ? entry.slotPool : [image || entry.icon].filter(Boolean),
    promoHtml: renderNormalModal(entry, lang),
    dateLabel,
    buttonLabel: sr ? "OTKRIJ PROMOCIJU" : "REVEAL PROMOTION",
  });
}

export function renderModalHTML(entry, lang = "sr", theme = "default") {
  if (!entry) {
    return lang === "sr"
      ? "<p>Ne postoje promocije za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  const title = entry.title || (promo && promo.title) || "";
  const button = entry.button || (promo && promo.button) || "";
  const buttonColor =
    entry.buttonColor || (promo && promo.buttonColor) || "green";
  const link = entry.link || (promo && promo.link) || "";
  const richHtml = entry.richHtml || (promo && promo.richHtml) || "";
  const defaultButtonLabel =
    button || (lang === "sr" ? "Registruj se" : "Register");

  if (entry?.slot || promo?.slot) return renderSlot(entry, lang);

  const isScratch = !!(entry?.scratch || promo?.scratch);
  const isFlip = !!(entry?.flipCard || promo?.flipCard);

  if (isScratch) {
    const shareKey =
      entry?.shareUrl ||
      `${entry?.year}-${entry?.month}-${entry?.day}-${type || "promo"}`;

    return renderScratchModal({
      title,
      richHtml,
      link,
      button: defaultButtonLabel,
      buttonColor,
      lang,
      shareKey,
      threshold: 0.7,
      theme,
      year: entry?.year,
      month: entry?.month,
      day: entry?.day,
      category: entry?.category,
      flipCard: isFlip,
    });
  }

  if (isFlip) {
    return renderFlipModal({ title, richHtml, link, button: defaultButtonLabel, buttonColor, lang, category: entry?.category });
  }

  return renderNormalModal(entry, lang);
}

// Samostalna flip kartica (bez grebanja): odmah slika, dodir je okreće na detalje
function renderFlipModal({ title: rawTitle, richHtml, link: rawLink, button: rawButton, buttonColor, lang, category }) {
  const title = esc(rawTitle);
  const link = esc(rawLink);
  const button = esc(rawButton);
  const { imgSrc, restHtml } = extractFirstImg(richHtml);
  const categoryLabel = getExclusiveBadgeLabel(category, lang);
  const canOpen = link && link !== "#";
  const ctaHtml = canOpen
    ? `<div class="pt-5 flex justify-center">
        <a href="${link}" data-track="cta" target="_blank" rel="noreferrer"
           class="w-4/5 max-w-[360px] px-4 py-3 rounded-[10px] text-sm text-center font-semibold
                  ${buttonColor === "yellow" ? "bg-[#FACC01] text-black" : "bg-[#17BB00] text-white"}
                  hover:brightness-110 transition">${button}</a>
      </div>`
    : "";

  return `
  <div class="w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden">
    <div class="flip-card-wrapper relative" style="aspect-ratio:360/430; perspective:1000px">
      ${renderFlipFaces({ imgSrc, title, categoryLabel, restHtml, ctaHtml, lang })}
    </div>
    <div id="flip-hint" class="mt-3 text-center text-xs text-white/70 uppercase tracking-[0.1em]">
      ${flipHintText(lang)}
    </div>
  </div>
  `;
}
