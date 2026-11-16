// src/components/promo/PromoIcon.js
// Ikonica dnevne promocije — pozicioniranje se razlikuje po varijanti kalendara, prosleđuje se preko className.
// next/image: umesto originala (do 1024px) Next šalje verziju prema `sizes`.
import Image from "next/image";

export default function PromoIcon({ src, className, alt = "promo icon", sizes = "200px", priority = false }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes={sizes}
      // Aktivna mobilna kartica je LCP: eager + visok prioritet (bez <link preload>,
      // koji bi je skidao i na desktopu, gde je mobilni prikaz sakriven)
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
    />
  );
}
