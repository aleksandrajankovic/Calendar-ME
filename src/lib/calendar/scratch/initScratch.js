// src/lib/scratch/initScratch.js
import confetti from "canvas-confetti";
import { markDayOpened } from "@/lib/calendar/calendarProgress";
import { confettiEmoji } from "@/lib/calendar/confetti";

// Konfete posle grebanja po stilu iz admina: emoji "kiša" (fudbal, Halloween, Božić, custom),
// klasične papirne konfete, ili ništa (off)
function launchConfetti(style) {
  if (style?.style === "off") return;
  const emoji = confettiEmoji(style);

  if (emoji.length) {
    const shapes = emoji.map((text) => confetti.shapeFromText({ text, scalar: 1.6 }));
    const base = { scalar: 1.6, flat: true, ticks: 400, gravity: 3.5, decay: 0.9, shapes, disableForReducedMotion: true };
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        confetti({
          ...base,
          particleCount: 8 + Math.floor(Math.random() * 8),
          spread: 50 + Math.random() * 50,
          startVelocity: 35 + Math.random() * 25,
          origin: { x: 0.25 + Math.random() * 0.5, y: 0.2 + Math.random() * 0.2 },
        });
      }, i * 80 + Math.random() * 40);
    }
    return;
  }

  const colors = ["#ff0000", "#ffd700", "#17bb00", "#0066ff", "#ff69b4", "#ffffff"];
  const opts = { ticks: 300, colors, disableForReducedMotion: true };
  confetti({ ...opts, particleCount: 80, spread: 70, startVelocity: 38, origin: { x: 0.35, y: 0.35 } });
  setTimeout(() => {
    confetti({ ...opts, particleCount: 60, spread: 80, startVelocity: 32, origin: { x: 0.65, y: 0.35 } });
  }, 150);
}

// Visina zadnje strane flip kartice (tekst je obično duži od slike) — meri se na skrivenoj kopiji
function measureNaturalHeight(el, widthPx) {
  const clone = el.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.visibility = "hidden";
  clone.style.pointerEvents = "none";
  clone.style.inset = "auto";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.height = "auto";
  clone.style.width = `${widthPx}px`;
  document.body.appendChild(clone);
  const h = clone.scrollHeight;
  document.body.removeChild(clone);
  return h;
}

// Dodir okreće flip karticu (slika ⇄ detalji); okvir prati visinu strane koja se vidi
export function attachFlipListener() {
  const inner = document.getElementById("flip-card-inner");
  if (!inner || inner.dataset.flipBound) return;
  inner.dataset.flipBound = "1";

  const hint = document.getElementById("flip-hint");
  const wrapper = inner.closest(".flip-card-wrapper");
  const backFace = inner.querySelector(".flip-card-back");
  const frontAspectRatio = wrapper?.style.aspectRatio || "360 / 430";

  inner.onclick = (e) => {
    if (e.target.closest("a, button")) return;
    const flipped = inner.classList.toggle("is-flipped");
    if (hint) hint.style.opacity = flipped ? "0" : "1";

    if (!wrapper) return;
    if (flipped && backFace) {
      const width = wrapper.getBoundingClientRect().width;
      wrapper.style.aspectRatio = "unset";
      wrapper.style.height = `${measureNaturalHeight(backFace, width)}px`;
    } else {
      wrapper.style.height = "";
      wrapper.style.aspectRatio = frontAspectRatio;
    }
  };
}

function getAnonUserId() {
  try {
    let id = localStorage.getItem("anon_user_id");
    if (!id) {
      id =
        (crypto?.randomUUID && crypto.randomUUID()) ||
        `u_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      localStorage.setItem("anon_user_id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function initScratch({ confetti: confettiStyle = null } = {}) {
  const canvas = document.getElementById("scratch-canvas");
  if (!canvas) return;

  const reveal = document.getElementById("scratch-reveal");
  const hint = document.getElementById("scratch-hint");
  const hint1 = document.getElementById("scratch-hint1");

  const threshold = Number(canvas.dataset.threshold || 0.7);
  const coverUrl = canvas.dataset.cover;
  const promoKey = canvas.dataset.key || "default";
  const theme = canvas.dataset.theme || "default";
  const isFlip = canvas.dataset.flip === "1";
  const bgImg = document.getElementById("scratch-bg-img");

  const userId = getAnonUserId();
  const storageKey = `scratch:${userId}:${promoKey}`;

  let revealed = false;
  let drawing = false;
  let last = { x: 0, y: 0 };
  let timer = null;

  function showReveal() {
    reveal?.classList.remove(
      "max-h-0",
      "opacity-0",
      "translate-y-2",
      "pointer-events-none"
    );
    reveal?.classList.add(
      "max-h-[1200px]",
      "opacity-100",
      "translate-y-0",
      "pointer-events-auto"
    );

    if (isFlip) {
      attachFlipListener();
      const flipHint = document.getElementById("flip-hint");
      if (flipHint) flipHint.style.opacity = "1";
      setTimeout(() => bgImg?.remove(), 520);
    }
  }

  function hideScratchInstant() {
    canvas.style.pointerEvents = "none";
    canvas.style.display = "none";
  }

  function fullyClearCanvas() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // already revealed
  try {
    if (localStorage.getItem(storageKey) === "1") {
      hint?.remove();
      hint1?.remove();
      hideScratchInstant();
      showReveal();
      return;
    }
  } catch {}

  function setup() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (!r.width || !r.height) return;

    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;

    img.onload = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.drawImage(img, 0, 0, r.width, r.height);
      canvas.style.backgroundColor = "transparent";

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 46;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    img.onerror = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(0, 0, r.width, r.height);
      canvas.style.backgroundColor = "transparent";

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 46;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
  }

  function scratch(from, to) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function percent() {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let clear = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) clear++;
    }
    return clear / (canvas.width * canvas.height);
  }

  function revealNow() {
    if (revealed) return;
    revealed = true;

    try {
      localStorage.setItem(storageKey, "1");
    } catch {}

    const y = parseInt(canvas.dataset.year, 10);
    const m = parseInt(canvas.dataset.month, 10);
    const d = parseInt(canvas.dataset.day, 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      markDayOpened(y, m, d);
    }

    hint?.remove();
    hint1?.remove();

    // analitika (calendarInteractions) — broji se samo pravo grebanje, ne ponovno otvaranje
    window.dispatchEvent(new CustomEvent("mb-scratch-revealed"));

    launchConfetti(confettiStyle || { style: theme === "football" ? "football" : "classic" });

    showReveal();
    fullyClearCanvas();

    canvas.style.pointerEvents = "none";
    canvas.style.transition = "opacity 250ms ease";
    canvas.style.opacity = "0";
    setTimeout(() => {
      canvas.style.display = "none";
    }, 260);
  }

  function check() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (percent() >= threshold) revealNow();
    }, 180);
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function down(e) {
    drawing = true;
    last = point(e);
    scratch(last, { x: last.x + 0.01, y: last.y });
    check();
  }

  function move(e) {
    if (!drawing) return;
    const p = point(e);
    scratch(last, p);
    last = p;
    check();
  }

  function up() {
    drawing = false;
  }

  setup();
  window.addEventListener("resize", setup, { once: true });

  canvas.onpointerdown = down;
  canvas.onpointermove = move;
  canvas.onpointerup = up;
  canvas.onpointerleave = up;
  canvas.onpointercancel = up;
}
