import { getTranslations } from "next-intl/server";
import CollectionGrid from "@/components/sections/CollectionGrid";
import ShopHero from "@/components/sections/ShopHero";
import ShopShell from "@/components/ui/ShopShell";
import { fetchProducts } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(locale, "/collection", t("collection_title"), t("collection_description"));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const products = await fetchProducts();

  return (
    <ShopShell locale={locale as Locale} transparentHeader>
      {/* Outer wrapper: relative so sticky cover is contained */}
      <div style={{ position: "relative" }}>

        {/* ── COVER — Kampagnenbild, ohne Schrift; Übergang siehe ShopHero ── */}
        <ShopHero src="/images/shop-hero-blond.jpg" alt="Verano Exotico – roter Bikini an der Mittelmeerküste" />
        {/* Überschrift für Google und Screenreader – im Bild bewusst ohne Schrift */}
        <h1 className="sr-only">Shop – Verano Exotico</h1>

        {/* ── PRODUCT GRID — schiebt sich über das Cover ────────── */}
        {/* data-header-solid-from: ab hier wird der durchsichtige Header dunkelblau */}
        <div
          data-header-solid-from
          style={{
            position: "relative",
            zIndex: 1,
            background: "#FFFFFF",
            boxShadow: "0 -30px 60px rgba(5,25,35,0.28)",
          }}
        >
          {/* Kategorien — interne Links für Google und schnelle Navigation */}
          <nav
            aria-label={locale === "en" ? "Categories" : "Kategorien"}
            className="flex gap-2 overflow-x-auto px-6 md:px-10 pt-6 pb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${locale}/${c.slug}`}
                className="px-4 py-2 text-[11px] font-mono rounded-full whitespace-nowrap"
                style={{ border: "1px solid rgba(26,48,64,0.2)", color: "#1A3040" }}
              >
                {c[locale as Locale].label}
              </Link>
            ))}
          </nav>
          <CollectionGrid products={products} locale={locale as Locale} showToolbar={false} />
        </div>

      </div>
    </ShopShell>
  );
}
