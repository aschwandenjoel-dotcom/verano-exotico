import type { MetadataRoute } from "next";
import { fetchProducts } from "@/lib/api";
import { SITE_URL as BASE } from "@/lib/seo";

const LOCALES = ["de", "en"] as const;

/** Seiten mit deutscher und englischer Fassung (hreflang-Paare). */
const TRANSLATED_PATHS = ["", "/collection", "/about"];
/** Nur Deutsch — /en zeigt per Canonical auf /de, gehört also nicht in die Sitemap. */
const GERMAN_ONLY_PATHS = ["/versand", "/faq", "/agb", "/widerruf", "/impressum", "/datenschutz"];

function languages(path: string) {
  return { de: `${BASE}/de${path}`, en: `${BASE}/en${path}`, "x-default": `${BASE}/de${path}` };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of TRANSLATED_PATHS) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        changeFrequency: path === "/collection" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/collection" ? 0.9 : 0.5,
        alternates: { languages: languages(path) },
      });
    }
    for (const product of products) {
      const path = `/product/${product.slug}`;
      entries.push({
        url: `${BASE}/${locale}${path}`,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: languages(path) },
      });
    }
  }
  for (const path of GERMAN_ONLY_PATHS) {
    entries.push({ url: `${BASE}/de${path}`, changeFrequency: "monthly", priority: 0.3 });
  }
  return entries;
}
