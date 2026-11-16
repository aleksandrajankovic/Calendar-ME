// src/lib/scratch/renderScratchModal.js
import { getExclusiveBadgeLabel } from "@/lib/calendar/promoCategoryStyles";
import { esc } from "../escapeHtml";

import { SCRATCH_COVER } from "@/lib/market";
export const flipHintText = (lang) => (lang === "sr" ? "Dodirni za detalje" : "Tap for details");

// Prednja strana (slika) i zadnja (naslov, opis, dugme) flip kartice — deli se sa samostalnim flipom
export function renderFlipFaces({ imgSrc, title, categoryLabel, restHtml, ctaHtml, lang }) {
  return `
    <div id="flip-card-inner" class="flip-card-inner h-full">
      <div class="flip-card-face absolute inset-0 rounded-2xl overflow-hidden">
        ${
          imgSrc
            ? `<img src="${imgSrc}" alt="" class="absolute inset-0 z-0 block w-full h-full object-cover" />`
            : `<div class="absolute inset-0 z-0 flex items-center justify-center text-white/70 text-sm leading-normal bg-[#6b21a8]">${lang === "sr" ? "Nema slike" : "No image"}</div>`
        }
      </div>
      <div class="flip-card-face flip-card-back absolute inset-0 rounded-2xl bg-[#05070D] px-4 py-5 overflow-y-auto">
        <h2 class="font-bold text-[22px] md:text-[26px] text-center text-white">${title}</h2>
        <div class="text-[11px] uppercase tracking-[0.12em] text-[#FACC01] mt-2 text-center">${categoryLabel}</div>
        ${
          restHtml
            ? `<div class="mt-3 text-sm text-center text-white/90 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:list-inside">${restHtml}</div>`
            : ""
        }
        ${ctaHtml}
      </div>
    </div>`;
}

export function extractFirstImg(richHtml = "") {
  if (!richHtml) return { imgSrc: "", restHtml: "" };

  const m = richHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  const imgSrc = m?.[1] || "";
  const restHtml = imgSrc ? richHtml.replace(m[0], "") : richHtml;

  return { imgSrc, restHtml };
}

export function renderScratchModal({
  title: rawTitle,
  richHtml,
  link: rawLink,
  button: rawButton,
  buttonColor,
  lang,
  shareKey,
  threshold = 0.7,
  coverSrc = SCRATCH_COVER,
  theme = "default",
  year,
  month,
  day,
  category,
  flipCard = false,
}) {
  // obični tekstovi iz admina se escape-uju (vidi escapeHtml.js); richHtml je sanitizovan HTML
  const title = esc(rawTitle);
  const link = esc(rawLink);
  const button = esc(rawButton);
  const { imgSrc, restHtml } = extractFirstImg(richHtml);

  const categoryLabel = getExclusiveBadgeLabel(category, lang);

  const isYellow = buttonColor === "yellow";
  const canOpen = link && link !== "#";

  const hintText = lang === "sr" ? "SPREMAN ZA IZNENAĐENJE?" : "Ready for a surprise?";
  const hintText1 =
    lang === "sr" ? "Ogrebi i otkrij današnju specijalnu promociju" : "Scratch to reveal today's offer";

  const safeKey = esc(shareKey || "default");

  const canvasEl = `
        <canvas
          id="scratch-canvas"
          data-key="${safeKey}"
          data-cover="${coverSrc}"
          data-threshold="${threshold}"
          data-theme="${theme}"
          data-year="${year ?? ""}"
          data-month="${month ?? ""}"
          data-day="${day ?? ""}"
          data-flip="${flipCard ? "1" : ""}"
          class="absolute -inset-px z-10 block touch-none select-none"
          style="width:calc(100% + 2px); height:calc(100% + 2px); background-color:#6b21a8"
        ></canvas>`;

  const ctaHtml = canOpen
          ? `<div class="pt-5 flex justify-center">
              <a href="${link}" data-track="cta" target="_blank" rel="noreferrer"
                 class="w-4/5 max-w-[360px] px-4 py-3 rounded-[10px]
                        text-sm text-center font-semibold
                        ${
                          isYellow
                            ? "bg-[#FACC01] text-black"
                            : "bg-[#17BB00] text-white"
                        }
                        hover:brightness-110 transition">
                ${button}
              </a>
            </div>`
          : "";

  // Flip kartica: posle grebanja ostaje uspravna kartica sa slikom, dodir je okreće na detalje
  if (flipCard) {
    return `
    <div class="w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden">
      <div class="flip-card-wrapper relative" style="aspect-ratio:360/430; perspective:1000px">
        <img
          id="scratch-bg-img"
          src="${imgSrc || coverSrc}"
          alt=""
          class="absolute inset-0 z-0 block w-full h-full object-cover rounded-2xl"
        />

        <div
          id="scratch-reveal"
          class="absolute inset-0 z-[5] opacity-0 pointer-events-none transition-opacity duration-300"
        >
          ${renderFlipFaces({ imgSrc, title, categoryLabel, restHtml, ctaHtml, lang })}
        </div>

        ${canvasEl}
      </div>

      <div id="scratch-hint" class="mt-3 text-center text-xl font-semibold text-white uppercase">${hintText}</div>
      <div id="scratch-hint1" class="text-[#FACC01] text-sm text-center uppercase">${hintText1}</div>
      <div id="flip-hint" class="mt-1 text-center text-xs text-white/70 uppercase tracking-[0.1em] opacity-0 transition-opacity duration-300">
        ${flipHintText(lang)}
      </div>
    </div>
    `;
  }

  return `
  <div class="w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden">

    <!-- SCRATCH AREA -->
    <div>
      <div class="relative h-[140px] overflow-hidden rounded-2xl bg-[#6b21a8] md:h-[160px]" style="line-height:0">
        ${
          imgSrc
            ? `<img src="${imgSrc}" alt="" class="absolute inset-0 z-0 block w-full h-full object-cover" />`
            : `<div class="absolute inset-0 z-0 flex items-center justify-center text-white/70 text-sm leading-normal">No image</div>`
        }

        ${canvasEl}
      </div>

      <!-- HINTS (nestaju kad se ogrebe) -->
      <div
        id="scratch-hint"
        class="mt-3 text-center text-xl font-semibold text-white uppercase"
      >${hintText}</div>

      <div
        id="scratch-hint1"
        class="text-[#FACC01] text-sm text-center uppercase"
      >${hintText1}</div>
    </div>

    <!-- REVEAL CONTENT -->
    <div
      id="scratch-reveal"
      class="
        px-4 pb-5
        overflow-hidden
        max-h-0 opacity-0 translate-y-2
        pointer-events-none
        transition-all duration-500 ease-out
      "
    >
      <h2 class="font-bold text-[22px] md:text-[26px] text-center text-white">
        ${title}
      </h2>

      <div class="text-[11px] uppercase tracking-[0.12em] text-[#FACC01] mt-2 text-center">
        ${categoryLabel}
      </div>

      ${
        restHtml
          ? `<div class="mt-3 text-sm text-white/90
                    [&_p]:mb-2 [&_p:last-child]:mb-0
                    [&_strong]:font-semibold
                    [&_ul]:list-disc [&_ul]:pl-5">
              ${restHtml}
            </div>`
          : ""
      }

      ${ctaHtml}
    </div>
  </div>
  `;
}
