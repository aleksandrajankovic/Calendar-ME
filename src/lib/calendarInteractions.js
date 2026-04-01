// src/lib/calendarInteractions.js
import { renderScratchModal } from "./scratch/renderScratchModal";
import { initScratch } from "./scratch/initScratch";



// -----------------------------
// NORMAL MODAL (bez scratch-a)
// -----------------------------
function renderNormalModal(entry, lang = "sr") {
  if (!entry) {
    return lang === "sr"
   ? "<p>Nema promocija za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  const title = entry.title || promo?.title || "";
  const button = entry.button || promo?.button || "";
  const buttonColor = entry.buttonColor || promo?.buttonColor || "green";
  const link = entry.link || promo?.link || "";
  const richHtml = entry.richHtml || promo?.richHtml || "";

  const defaultButtonLabel =
    button || (lang === "sr" ? "Registruj se" : "Register");

  // ako baš nemamo nikakav sadržaj
  if (!promo && !richHtml) {
    return lang === "sr"
  ? "<p>Nema promocija za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  // --- izvlačenje prve <img> iz richHtml ---
  let imageHtml = null;
  let contentHtml = richHtml;

  if (contentHtml) {
    const imgMatch = contentHtml.match(/<img[^>]*>/i);
    if (imgMatch) {
      imageHtml = imgMatch[0];
      contentHtml = contentHtml.replace(imgMatch[0], "");
    }
  }

  // --- label ---
  const categoryLabel =
    type === "special"
      ? lang === "sr"
        ? "Specijalna promocija"
        : "Special promotion"
      : lang === "sr"
      ? "Nedeljna promocija"
      : "Weekly promotion";

  const openUrl = link && String(link);
  const canOpen = openUrl && openUrl !== "#";
  const isYellow = buttonColor === "yellow";

  return `
    <div class="flex flex-col w-full max-w-[420px] mx-auto">
      ${
        imageHtml
          ? `<div class="mb-4 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl">${imageHtml}</div>`
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
          ? `<div class="text-sm leading-relaxed text-white/90
              [&_p]:mb-2 [&_p:last-child]:mb-0
              [&_strong]:font-semibold
              [&_ul]:list-disc [&_ul]:pl-5
            ">
              ${contentHtml}
            </div>`
          : ""
      }

      ${
        canOpen
          ? `<div class="pt-5 mt-2 flex justify-center">
              <a href="${openUrl}" target="_blank" rel="noreferrer"
                 class="w-4/5 max-w-[360px] inline-flex items-center justify-center
                        px-4 py-3 rounded-[10px] text-sm font-semibold font-condensed
                        shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition
                        ${
                          isYellow
                            ? "bg-[#FACC01] text-black"
                            : "bg-[#17BB00] text-white"
                        }
                        hover:brightness-110">
                ${defaultButtonLabel}
              </a>
            </div>`
          : ""
      }
    </div>
  `;
}

// -----------------------------
// MAIN RENDER
// -----------------------------
function renderModalHTML(entry, lang = "sr") {
  if (!entry) {
    return lang === "sr"
        ? "<p>Nema promocija za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  const title = entry.title || promo?.title || "";
  const button = entry.button || promo?.button || "";
  const buttonColor = entry.buttonColor || promo?.buttonColor || "green";
  const link = entry.link || promo?.link || "";
  const richHtml = entry.richHtml || promo?.richHtml || "";

  const defaultButtonLabel =
    button || (lang === "sr" ? "Registruj se" : "Register");

  const isScratch = !!(entry?.scratch || promo?.scratch);

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
      type,
      lang,
      shareKey,
      threshold: 0.7,
    });
  }

  // Normal modal
  return renderNormalModal(entry, lang);
}

// -----------------------------
// INIT FUNKCIJA
// -----------------------------
export function initCalendarInteractions(rootSelector = "#calendar-root") {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const dataEl = root.querySelector("#calendar-data");
  if (!dataEl) return;

  const payload = JSON.parse(dataEl.textContent || "{}");
  const days = Array.isArray(payload.days) ? payload.days : [];
  const lang = payload.lang || "sr";

  const modal = root.querySelector("#promo-modal");
  const content = root.querySelector("#promo-content");
  const closeBtn = root.querySelector("#promo-close");
  const dialog = modal ? modal.querySelector("#promo-dialog") : null;

  if (!modal || !content) return;

  let isOpen = false;
  let previousUrl = null;

  function animateOpen() {
    if (!dialog) return;

    dialog.classList.remove("opacity-100", "translate-y-0", "scale-100");
    dialog.classList.add("opacity-0", "translate-y-4", "scale-95");

    requestAnimationFrame(() => {
      dialog.classList.remove("opacity-0", "translate-y-4", "scale-95");
      dialog.classList.add("opacity-100", "translate-y-0", "scale-100");
    });
  }

  function animateClose(cb) {
    if (!dialog) return cb?.();

    dialog.classList.remove("opacity-100", "translate-y-0", "scale-100");
    dialog.classList.add("opacity-0", "translate-y-4", "scale-95");

    setTimeout(() => cb?.(), 200);
  }

  function openModal(entry) {
    content.innerHTML = renderModalHTML(entry, lang);

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    isOpen = true;

    previousUrl = window.location.href;

    if (entry?.shareUrl) {
      history.pushState({ promo: true }, "", entry.shareUrl);
    }

    animateOpen();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const canvas = document.getElementById("scratch-canvas");
        if (canvas) initScratch();
      });
    });
  }

  function closeModal({ fromPopstate = false } = {}) {
    isOpen = false;
    document.body.style.overflow = "";

    animateClose(() => {
      modal.classList.add("hidden");
      content.innerHTML = "";

      if (!fromPopstate && previousUrl) {
        history.replaceState(null, "", previousUrl);
      }
    });
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day-button]");
    if (!btn) return;

    const day = Number(btn.getAttribute("data-day"));
    const entry = days.find((d) => d.day === day);
    if (!entry) return;

    openModal(entry);
  });

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeModal();
  });

  window.addEventListener("popstate", () => {
    if (isOpen) closeModal({ fromPopstate: true });
  });
}

export default initCalendarInteractions;
