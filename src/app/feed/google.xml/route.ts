import { fetchProducts } from "@/lib/api";
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
 * Eine Zeile pro Grösse (item_group_id = Produkt), weil Google für Bekleidung
 * Varianten mit `size` erwartet. Preise in CHF, Sprache Deutsch, Land Schweiz —
 * für DE/AT wäre ein zweiter Feed mit EUR-Preisen nötig (siehe Doku).
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

/** Hauptbild wie im Shop: Galerie zuerst, sonst das erste Farbbild. */
function imagesOf(product: Product): string[] {
  const gallery = product.images ?? [];
  const colorImages = (product.colorImages ?? []).filter(Boolean);
  const all = [...gallery, ...colorImages.filter((img) => !gallery.includes(img))];
  return all.map(absolute);
}

function describe(product: Product): string {
  const parts = [product.description[FEED_LOCALE], product.material[FEED_LOCALE]].filter(Boolean);
  return parts.join(" ").slice(0, 5000);
}

function itemXml(product: Product, size: string | null, images: string[]): string {
  const id = size ? `${product.slug}-${size}` : product.slug;
  const colorName = (product.colorNames?.[FEED_LOCALE] ?? []).filter(Boolean).join("/");
  const link = `${SITE}/${FEED_LOCALE}/product/${product.slug}`;
  const [main, ...more] = images;

  const fields: Array<[string, string]> = [
    ["g:id", id],
    ["g:title", product.name[FEED_LOCALE]],
    ["g:description", describe(product)],
    ["g:link", link],
    ["g:image_link", main],
    ...more.slice(0, 10).map((img): [string, string] => ["g:additional_image_link", img]),
    ["g:availability", "in_stock"],
    ["g:price", chf(product.price)],
    ["g:brand", BRAND],
    ["g:condition", "new"],
    ["g:google_product_category", GOOGLE_CATEGORY],
    ["g:product_type", "Bademode > Bikinis & Badeanzüge"],
    ["g:gender", "female"],
    ["g:age_group", "adult"],
    // Keine GTIN/EAN vorhanden (Eigenmarke) — ohne diese Angabe lehnt Google
    // Bekleidungsartikel ab.
    ["g:identifier_exists", "no"],
  ];
  if (colorName) fields.push(["g:color", colorName]);
  if (size) {
    fields.push(["g:size", size]);
    fields.push(["g:item_group_id", product.slug]);
  }
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
    const images = imagesOf(product);
    if (images.length === 0) continue; // Google lehnt Artikel ohne Bild ab
    const sizes = (product.sizes ?? []).filter(Boolean);
    if (sizes.length === 0) {
      items.push(itemXml(product, null, images));
    } else {
      for (const size of sizes) items.push(itemXml(product, size, images));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(BRAND)}</title>
    <link>${SITE}/${FEED_LOCALE}</link>
    <description>Bademode für endlose Sommer — Bikinis und Badeanzüge aus der Schweiz.</description>
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
