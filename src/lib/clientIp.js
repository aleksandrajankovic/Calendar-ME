// src/lib/clientIp.js
// IP posetioca za ograničenje broja zahteva. Sajt je iza Cloudflare-a: CF-Connecting-IP postavlja
// Cloudflare i posetilac ne može da ga podmetne, dok prvi unos u X-Forwarded-For šalje sam
// posetilac — sa njim je ograničenje pokušaja logina moglo da se zaobiđe menjanjem zaglavlja.
export function getClientIp(req) {
  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
