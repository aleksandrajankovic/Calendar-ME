// src/app/fonts.js
import localFont from "next/font/local";
import { Bebas_Neue, Rowdies, Russo_One } from "next/font/google";

// preload: false za fontove specifične za temu — next/font inače preload-uje SVE
// deklarisane fontove na svakoj stranici, pa na sporoj mreži guše LCP sliku.
// Font se i dalje učitava čim ga stranica koristi (display: swap).

// Brojevi dana (default i football desktop) — vidljivi odmah, ostaje preload
export const rowdies = Rowdies({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-rowdies", // slot mašina (slotReveal.css) ga koristi preko CSS promenljive
});

export const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

export const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

export const exo2Black = localFont({
  src: "./fonts/exo2/Exo2-Black.ttf",
  weight: "900",
  style: "normal",
  preload: false,
});
