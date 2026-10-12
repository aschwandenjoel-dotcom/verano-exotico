import { getTranslations } from "next-intl/server";
import CollectionGrid from "@/components/sections/CollectionGrid";
import Image from "next/image";
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
    <ShopShell locale={locale as Locale}>
      {/* Outer wrapper: relative so sticky cover is contained */}
      <div style={{ position: "relative" }}>

        {/* ── COVER — ein Kampagnenbild, gross und ruhig wie in einer Luxus-Kampagne.
            Ohne Schrift im Bild und nur mit zarten Verläufen, damit die Farben leuchten. ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            width: "100%",
            height: "clamp(360px, 56vw, 100svh)",
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          <Image
            src="/images/shop-hero-rot.jpg"
            alt="Verano Exotico – roter Bikini an der Mittelmeerküste"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(5,25,35,0.22) 0%, rgba(5,25,35,0) 16%, rgba(5,25,35,0) 80%, rgba(5,25,35,0.3) 100%)",
            }}
          />
          {/* Überschrift für Google und Screenreader – im Bild bewusst ohne Schrift */}
          <h1 className="sr-only">Shop – Verano Exotico</h1>
        </div>

        {/* ── PRODUCT GRID — schiebt sich über das Cover ────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#F8F3E8",
            borderRadius: "16px 16px 0 0",
            marginTop: "-24px",
            boxShadow: "0 -8px 40px rgba(10,61,82,0.18)",
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
          <CollectionGrid products={products} locale={locale as Locale} />
        </div>

      </div>
    </ShopShell>
  );
}
