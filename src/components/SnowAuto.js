// src/components/SnowAuto.jsx
"use client";

import SnowOverlay from "./SnowOverlay";

export default function SnowAuto() {
  const now = new Date();
  const month = now.getMonth(); 
  const day = now.getDate();

  const showSnow =
    (month === 11 && day >= 24) || 
    (month === 0 && day <= 14); 

  if (!showSnow) return null;

  return <SnowOverlay />;
}
