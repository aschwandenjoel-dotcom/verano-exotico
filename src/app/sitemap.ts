import type { MetadataRoute } from "next";
import { fetchProducts } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const LOCALES = ["de", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts();
  const now = new Date();
  const staticPaths = ["", "/collection", "/about", "/versand", "/faq", "/agb", "/widerruf", "/impressum", "/datenschutz"];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "/collection" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/collection" ? 0.9 : 0.5,
      });
    }
    for (const product of products) {
      entries.push({
        url: `${BASE}/${locale}/product/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }
  return entries;
}
