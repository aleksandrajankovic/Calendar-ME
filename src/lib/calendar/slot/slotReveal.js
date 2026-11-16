const DURATIONS = [1100, 1550, 2000];
const HIGHLIGHT_MS = 550;
const REEL_LENGTHS = [24, 31, 38];
const MORPH_FADE_MS = 180;
const MORPH_MS = 420;
const CONFETTI_MS = 2800;
const FOIL_COLORS = ["#6e5220", "#8f6d2c", "#b8924a", "#d4b26f", "#ecd9a6", "#fff6dc"];

function renderLights(count, radius) {
  const dash = `0 ${200 / count}`;
  const rect = (cls, offset) =>
    `<rect class="${cls}" width="100%" height="100%" rx="${radius}" pathLength="100" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" />`;
  return `<svg class="slot-lights" aria-hidden="true">${rect("slot-bulbs-a", 0)}${rect("slot-bulbs-b", 100 / count)}</svg>`;
}

export function firstImage(richHtml = "") {
  return richHtml.match(/<img[^>]*src=["']([^"']+)["']/i)?.[1] || "";
}

export function renderSlotModal({ image, icon, pool, promoHtml, dateLabel, buttonLabel, note }) {
  const data = JSON.stringify({ image, icon, pool }).replace(/</g, "\\u003c");
  return `
    <div id="slot-reveal" class="slot-reveal">
      <div class="slot-decor" aria-hidden="true">
        <div class="slot-decor-glow"></div>
        ${renderLights(84, 27)}
      </div>
      <div class="slot-stage">
        <p class="slot-date">${dateLabel}</p>
        <div class="slot-frame">
          ${renderLights(44, 12)}
          <div class="slot-reels">
            <div class="slot-reel"><div class="slot-strip"></div></div>
            <div class="slot-reel"><div class="slot-strip"></div></div>
            <div class="slot-reel"><div class="slot-strip"></div></div>
            <div class="slot-payline" aria-hidden="true"></div>
          </div>
        </div>
        <button type="button" class="slot-button">${buttonLabel}</button>
        ${note ? `<p class="slot-note">${note}</p>` : ""}
      </div>
      <div class="slot-promo" hidden data-date="${dateLabel}">${promoHtml}</div>
      <script type="application/json" class="slot-data">${data}</script>
    </div>`;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pick(list, avoid) {
  const options = list.filter((item) => item !== avoid);
  const source = options.length ? options : list;
  return source[Math.floor(Math.random() * source.length)];
}

// src dolazi iz admina (slika iz opisa ili ikonica) — escape, jer ide u innerHTML
const escAttr = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function cellHtml(src, slice) {
  return `<div class="slot-cell"><img src="${escAttr(src)}" alt="" draggable="false" style="--slice:${slice}" /></div>`;
}

function buildStrip(strip, target, pool, length, slice) {
  const items = Array.from({ length }, () => cellHtml(pick(pool, target), slice));
  items[1] = cellHtml(target, slice);
  strip.innerHTML = items.join("");
  return strip.firstElementChild.offsetHeight;
}

function spinReel(strip, cell, length, duration, reduced) {
  const from = -(length - 3) * cell;
  const move = strip.animate(
    [
      { transform: `translateY(${from}px)`, easing: "cubic-bezier(.3,.04,.14,1)" },
      { transform: `translateY(${cell * 0.08}px)`, offset: 0.95, easing: "ease-in-out" },
      { transform: "translateY(0)" },
    ],
    { duration: reduced ? 1 : duration, fill: "forwards" },
  );
  return move.finished;
}

function createFoil(x, y, direction, delay, small) {
  const angle = -Math.PI / 2 + direction * (small ? Math.random() * 0.8 - 0.4 : 0.2 + Math.random() * 1.05);
  const speed = (small ? 550 : 700) + Math.random() * (small ? 800 : 1000);
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    width: 5 + Math.random() * 5,
    height: 9 + Math.random() * 9,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 5,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 5 + Math.random() * 7,
    sway: Math.random() * Math.PI * 2,
    delay,
  };
}

function createSpark(x, y, direction, delay, small) {
  const angle = -Math.PI / 2 + direction * (small ? Math.random() * 0.9 - 0.45 : 0.1 + Math.random() * 1.2);
  const speed = 300 + Math.random() * 700;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 2.5 + Math.random() * 4.5,
    phase: Math.random() * Math.PI * 2,
    delay,
  };
}

function drawFoil(ctx, p) {
  const face = Math.cos(p.flip);
  const shine = (face + 1) / 2;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.scale(1, Math.max(0.12, Math.abs(face)));
  ctx.fillStyle = FOIL_COLORS[Math.min(FOIL_COLORS.length - 1, Math.floor(shine * FOIL_COLORS.length))];
  ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
  ctx.restore();
}

function drawSpark(ctx, p, elapsed) {
  const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(p.phase + elapsed * 0.009));
  const size = p.size * twinkle;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha *= twinkle;
  ctx.fillStyle = "#fff3d0";
  ctx.shadowColor = "#e8c67a";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 ? size * 0.22 : size;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function launchConfetti(root) {
  const canvas = document.createElement("canvas");
  canvas.className = "slot-confetti";
  canvas.setAttribute("aria-hidden", "true");
  const dialog = root.offsetParent || root;
  (dialog.parentElement || document.body).prepend(canvas);
  const ctx = canvas.getContext("2d");
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = innerWidth;
  const height = innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);

  const box = dialog.getBoundingClientRect();
  const small = width < 640;
  const originY = box.top + (small ? 8 : box.height * 0.3);
  const foils = [];
  const sparks = [];
  [
    [box.left + (small ? 40 : 10), -1],
    [box.right - (small ? 40 : 10), 1],
  ].forEach(([x, direction]) => {
    for (let i = 0; i < (small ? 26 : 42); i += 1) foils.push(createFoil(x, originY, direction, Math.random() * 260, small));
    for (let i = 0; i < (small ? 12 : 20); i += 1) sparks.push(createSpark(x, originY, direction, Math.random() * 200, small));
  });

  let frame;
  const start = performance.now();
  let last = start;
  const draw = (now) => {
    const elapsed = now - start;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const fade = Math.max(0, 1 - Math.max(0, elapsed - CONFETTI_MS + 700) / 700);
    ctx.clearRect(0, 0, width, height);

    for (const p of foils) {
      if (elapsed < p.delay) continue;
      const drag = Math.exp(-3.1 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + 640 * dt;
      p.sway += 3 * dt;
      p.x += (p.vx + Math.sin(p.sway) * 34) * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;
      p.flip += p.flipSpeed * dt;
      ctx.globalAlpha = fade;
      drawFoil(ctx, p);
    }
    for (const p of sparks) {
      if (elapsed < p.delay) continue;
      const drag = Math.exp(-2.6 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + 150 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = fade;
      drawSpark(ctx, p, elapsed);
    }

    if (elapsed < CONFETTI_MS) frame = requestAnimationFrame(draw);
    else canvas.remove();
  };
  frame = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(frame);
    canvas.remove();
  };
}

async function showPromo(root, onRevealed, reduced) {
  const stage = root.querySelector(".slot-stage");
  const promo = root.querySelector(".slot-promo");

  if (!reduced) {
    root.classList.add("slot-assembled");
    await wait(MORPH_FADE_MS);
  }
  const from = root.querySelector(".slot-reels").getBoundingClientRect();
  const startHeight = root.offsetHeight;
  stage.hidden = true;
  promo.hidden = false;
  root.classList.add("slot-revealed");
  onRevealed();
  if (reduced) return;

  const easing = "cubic-bezier(.3,.7,.2,1)";
  root.animate([{ height: `${startHeight}px` }, { height: `${root.offsetHeight}px` }], { duration: MORPH_MS, easing });

  const image = promo.querySelector("img");
  const to = image?.getBoundingClientRect();
  if (to?.width) {
    image.animate(
      [
        {
          transformOrigin: "0 0",
          transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
        },
        { transformOrigin: "0 0", transform: "none" },
      ],
      { duration: MORPH_MS, easing },
    );
  }
  [...promo.firstElementChild.children].slice(image ? 1 : 0).forEach((el, i) => {
    el.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 320, delay: 160 + i * 50, easing: "ease-out", fill: "backwards" },
    );
  });
}

function addDateChip(promo) {
  if (promo.querySelector(".slot-promo-date")) return;
  const content = promo.firstElementChild;
  const chip = document.createElement("span");
  chip.className = "slot-promo-date";
  chip.textContent = promo.dataset.date;
  const anchor = promo.querySelector("img")?.parentElement;
  if (anchor) anchor.after(chip);
  else content.prepend(chip);
}

// confetti: false — bez zlatnih konfeta (u adminu izabrano "Off")
export function initSlot({ alreadyOpened = false, confetti = true, onStopped = () => {}, onRevealed = () => {} } = {}) {
  const root = document.getElementById("slot-reveal");
  if (!root) return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  addDateChip(root.querySelector(".slot-promo"));

  if (alreadyOpened) {
    root.querySelector(".slot-stage").hidden = true;
    root.querySelector(".slot-promo").hidden = false;
    root.classList.add("slot-revealed");
    return () => {};
  }

  const { image, icon, pool } = JSON.parse(root.querySelector(".slot-data").textContent);
  if (!image) root.classList.add("slot-no-image");
  const strips = [...root.querySelectorAll(".slot-strip")];
  const button = root.querySelector(".slot-button");
  const cell = strips.map((strip, i) => buildStrip(strip, image || icon, pool, REEL_LENGTHS[i], i))[0];
  strips.forEach((strip, i) => {
    strip.style.transform = `translateY(${-(REEL_LENGTHS[i] - 3) * cell}px)`;
  });
  [image || icon, ...pool].forEach((src) => {
    new Image().src = src;
  });

  let timer;
  let stopConfetti = () => {};
  let cancelled = false;
  async function spin() {
    button.disabled = true;
    root.classList.add("slot-spinning");
    await Promise.all(strips.map((strip, i) => spinReel(strip, cell, REEL_LENGTHS[i], DURATIONS[i], reduced)));
    if (cancelled) return;
    root.classList.remove("slot-spinning");
    root.classList.add("slot-stopped");
    onStopped();
    if (!reduced && confetti) stopConfetti = launchConfetti(root);
    timer = setTimeout(() => showPromo(root, onRevealed, reduced), reduced ? 0 : HIGHLIGHT_MS);
  }
  button.addEventListener("click", spin);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    stopConfetti();
    button.removeEventListener("click", spin);
  };
}
