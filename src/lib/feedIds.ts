import type { Product } from "@/types";

/**
 * Artikelnummern im Google-/Pinterest-Feed — dieselbe Funktion für den Feed
 * (/feed/google.xml) und das Kauf-Ereignis an Google (Bestellbestätigung).
 * Stimmen die beiden nicht überein, kann Google Käufe keinem Produkt zuordnen.
 *
 * Einfarbig: `<slug>-<grösse>` · mehrfarbig: `<slug>-c<farbindex>-<grösse>`.
 */
export function isMultiColor(product: Product): boolean {
  return (product.colorNames?.de ?? []).length > 1;
}

export function feedItemId(product: Product, colorIndex: number | null, size: string | null): string {
  const colorPart = isMultiColor(product) && colorIndex !== null ? `-c${colorIndex}` : "";
  return `${product.slug}${colorPart}${size ? `-${size}` : ""}`;
}

/** Farbindex einer Bestellposition (gespeichert ist der Farbcode, zur Not der Farbname). */
export function colorIndexOf(product: Product, hex: string | null, colorName: string | null): number | null {
  const byHex = hex ? product.colors.findIndex((c) => c.toLowerCase() === hex.toLowerCase()) : -1;
  if (byHex >= 0) return byHex;
  const names = [...(product.colorNames?.de ?? []), ...(product.colorNames?.en ?? [])];
  const byName = colorName ? names.indexOf(colorName) : -1;
  if (byName >= 0) return byName % Math.max(product.colorNames?.de?.length ?? 1, 1);
  return null;
}
