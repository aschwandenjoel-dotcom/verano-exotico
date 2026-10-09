import imageOverrides from "@/data/feed-image-overrides.json";
import { fetchProducts } from "@/lib/api";
import { feedProductType } from "@/lib/categories";
import { plainText } from "@/lib/seo";
import { calcShipping } from "@/lib/shipping";
import type { Product } from "@/types";

/**
 * Produktfeed im Google-Merchant-Format (RSS 2.0 + g:-Namespace).
 *
 * Dient zwei Kanälen mit derselben URL:
 *   - Google Merchant Center → kostenlose Shopping-Listings ("Bikini kaufen Schweiz")
 *   - Pinterest Katalog       → automatische Produkt-Pins
 *
 * Liegt bewusst unter /feed/ und nicht unter /api/: robots.txt sperrt /api/
 * für Crawler, und Google holt den Feed mit dem Googlebot ab.
 *
 * Eine Zeile pro Farbe × Grösse (item_group_id = Produkt): Google erlaubt pro
 * Artikel höchstens drei Farben und verlangt, dass das Hauptbild genau die
 * angegebene Farbe zeigt. Produkte mit nur einer Farbe behalten ihre alten IDs
 * (`<slug>-<grösse>`), mehrfarbige bekommen `<slug>-c<index>-<grösse>`.
 * Der Link führt mit `?farbe=<index>` direkt zur passenden Farbe.
 *
 * `src/data/feed-image-overrides.json` ersetzt das Hauptbild einzelner Farben —
 * für Artikel, die Google wegen zu freizügiger Modelbilder als „nur für
 * Erwachsene" abgelehnt hat (Format: { slug: { farbindex: "/products/…" } }).
 *
 * Preise in CHF, Sprache Deutsch, Land Schweiz — für DE/AT wäre ein zweiter
 * Feed mit EUR-Preisen nötig (siehe Doku).
 */
export const revalidate = 3600;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://verano-exotico.ch").replace(/\/$/, "");
const BRAND = "Verano Exotico";
/** Google-Taxonomie: Apparel & Accessories > Clothing > Swimwear */
const GOOGLE_CATEGORY = "211";
const FEED_LOCALE = "de";
const FEED_COUNTRY = "CH";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chf(amount: number): string {
  return `${amount.toFixed(2)} CHF`;
}

function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

const OVERRIDES = imageOverrides as Record<string, Record<string, string>>;

interface Variant {
  /** Index in colors/colorNames/colorImages; null = Produkt ohne Farbangabe */
  colorIndex: number | null;
  colorName: string | null;
  image: string;
  /** Mehrere Farben → Farbe in ID, Titel und Link */
  multiColor: boolean;
}

/** Eine Variante pro Farbe, jeweils mit dem Bild genau dieser Farbe. */
function variantsOf(product: Product): Variant[] {
  const names = product.colorNames?.[FEED_LOCALE] ?? [];
  const colorImages = product.colorImages ?? [];
  const gallery = (product.images ?? []).filter(Boolean);
  const override = OVERRIDES[product.slug] ?? {};
  const imageFor = (i: number) => override[String(i)] || colorImages[i] || "";

  if (names.length <= 1) {
    const image = imageFor(0) || gallery[0] || "";
    return image ? [{ colorIndex: names.length ? 0 : null, colorName: names[0] ?? null, image, multiColor: false }] : [];
  }
  return names
    .map((name, i) => ({ colorIndex: i, colorName: name, image: imageFor(i), multiColor: true }))
    // Ohne eigenes Farbbild fällt die Farbe weg: ein Galeriebild zeigte die falsche Farbe.
    .filter((v) => v.image);
}

/** Weitere Bilder: Galerie ohne das Hauptbild — bei ersetzten Bildern keine, damit Google nur das sichere Bild prüft. */
function moreImages(product: Product, main: string): string[] {
  if (OVERRIDES[product.slug]) return [];
  return (product.images ?? []).filter((img) => img && img !== main).slice(0, 10);
}

function describe(product: Product): string {
  const parts = [plainText(product.description[FEED_LOCALE]), product.material[FEED_LOCALE]].filter(Boolean);
  return parts.join(" ").slice(0, 5000);
}

function itemXml(product: Product, variant: Variant, size: string | null): string {
  const colorPart = variant.multiColor ? `-c${variant.colorIndex}` : "";
  const id = `${product.slug}${colorPart}${size ? `-${size}` : ""}`;
  const title = variant.multiColor && variant.colorName
    ? `${product.name[FEED_LOCALE]} – ${variant.colorName}`
    : product.name[FEED_LOCALE];
  const link = `${SITE}/${FEED_LOCALE}/product/${product.slug}${variant.multiColor ? `?farbe=${variant.colorIndex}` : ""}`;
  const main = absolute(variant.image);
  const more = moreImages(product, variant.image).map(absolute);

  const fields: Array<[string, string]> = [
    ["g:id", id],
    ["g:title", title.slice(0, 150)],
    ["g:description", describe(product)],
    ["g:link", link],
    ["g:image_link", main],
    ...more.map((img): [string, string] => ["g:additional_image_link", img]),
    ["g:availability", "in_stock"],
    ["g:price", chf(product.price)],
    ["g:brand", BRAND],
    ["g:condition", "new"],
    ["g:google_product_category", GOOGLE_CATEGORY],
    ["g:product_type", feedProductType(product)],
    ["g:gender", "female"],
    ["g:age_group", "adult"],
    // Keine GTIN/EAN vorhanden (Eigenmarke) — ohne diese Angabe lehnt Google
    // Bekleidungsartikel ab.
    ["g:identifier_exists", "no"],
  ];
  if (variant.colorName) fields.push(["g:color", variant.colorName]);
  if (size) fields.push(["g:size", size]);
  if (size || variant.multiColor) fields.push(["g:item_group_id", product.slug]);
  if (product.isNew) fields.push(["g:custom_label_0", "new"]);

  const body = fields.map(([tag, value]) => `      <${tag}>${esc(value)}</${tag}>`).join("\n");

  // Versand: Grundpreis der Zone für ein Einzelstück, wie an der Kasse.
  const shipping = `      <g:shipping>
        <g:country>${FEED_COUNTRY}</g:country>
        <g:price>${chf(calcShipping(FEED_COUNTRY, 1))}</g:price>
      </g:shipping>`;

  return `    <item>\n${body}\n${shipping}\n    </item>`;
}

export async function GET() {
  let products: Product[];
  try {
    products = await fetchProducts();
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB-Fehler";
    return new Response(`Feed nicht verfügbar: ${message}`, { status: 500 });
  }

  const items: string[] = [];
  for (const product of products) {
    const sizes = (product.sizes ?? []).filter(Boolean);
    // Varianten ohne Bild fallen weg — Google lehnt Artikel ohne Bild ab
    for (const variant of variantsOf(product)) {
      if (sizes.length === 0) items.push(itemXml(product, variant, null));
      else for (const size of sizes) items.push(itemXml(product, variant, size));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(BRAND)}</title>
    <link>${SITE}/${FEED_LOCALE}</link>
    <description>Bademode für endlose Sommer — Bikinis und Badeanzüge vom Schweizer Onlineshop.</description>
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
