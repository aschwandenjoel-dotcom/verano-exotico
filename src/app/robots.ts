import type { MetadataRoute } from "next";
import { SITE_URL as BASE } from "@/lib/seo";

/**
 * KI-Crawler ausdrücklich zugelassen (Suche und Training), damit Assistenten wie
 * ChatGPT, Claude, Perplexity und Gemini den Shop lesen und korrekt zitieren können.
 * Für alle gilt dasselbe: Admin und API bleiben gesperrt.
 */
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
