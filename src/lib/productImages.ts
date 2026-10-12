import type { Product } from "@/types";

/**
 * Bilder einer Produktkarte im H&M-Stil: Packshot auf Weiss als Titelbild, beim
 * Überfahren das Model-Bild. Erkannt an den Dateinamen <slug>-packshot / <slug>-model
 * (siehe tools/product-images.mjs).
 *
 * Hat das Produkt schon einen Packshot, aber noch kein Model-Bild, gibt es kein
 * Hover-Bild – sonst käme ein altes Lieferantenfoto, oft in einer anderen Farbe.
 */
export function cardImages(product: Product): { title?: string; hover?: string } {
  // Farb-Bilder zuerst, dann allgemeine Bilder – ohne Duplikate
  const colorImgs = (product.colorImages ?? []).filter(Boolean);
  const all = [...colorImgs, ...(product.images ?? []).filter((s) => s && !colorImgs.includes(s))];
  const packshot = all.find((s) => s.includes("-packshot"));
  const title = packshot ?? all[0];
  const hover = all.find((s) => s.includes("-model")) ?? (packshot ? undefined : all.find((s) => s !== title));
  return { title, hover: hover !== title ? hover : undefined };
}

/**
 * KI-generiertes Bild? Packshots und Model-Bilder (tools/product-images.mjs) sowie die
 * Kampagnen- und Stimmungsbilder unter /images/ (Titelbilder, Über uns). Lieferantenfotos
 * von CJ sind echte Fotos und bleiben ohne Kennzeichnung.
 */
export function isAiImage(src: string | undefined): boolean {
  if (!src) return false;
  return /-packshot\.|-model\.|\/images\/(about\/|home-hero|shop-hero)/.test(src);
}
