import { getTranslations } from "next-intl/server";
import CollectionGrid from "@/components/sections/CollectionGrid";
import ShopHeroCarousel from "@/components/sections/ShopHeroCarousel";
import ShopShell from "@/components/ui/ShopShell";
import { fetchProducts } from "@/lib/api";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("collection_title") };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const products = await fetchProducts();
  const t = await getTranslations({ locale, namespace: "collection" });

  return (
    <ShopShell locale={locale as Locale}>
      {/* Outer wrapper: relative so sticky cover is contained */}
      <div style={{ position: "relative" }}>

        {/* ── COVER — sticky, bleibt kleben ─────────────────────── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            width: "100%",
            height: "clamp(300px, 52vw, 820px)",
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          {/* Background image — rotating beach panoramas, crossfade every 10s */}
          <ShopHeroCarousel alt="Verano Exotico SS25" />

          {/* Dark gradient overlay — top + strong bottom */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(10,61,82,0.65) 0%, rgba(10,61,82,0.22) 28%, rgba(10,61,82,0.28) 55%, rgba(10,61,82,0.62) 76%, rgba(10,61,82,0.92) 100%)",
            }}
          />

          {/* Top-left: season label */}
          <div
            style={{
              position: "absolute",
              top: "clamp(5rem, 9vw, 7rem)",
              left: "clamp(1.5rem, 5vw, 3rem)",
            }}
          >
            <p
              style={{
                color: "rgba(248,243,232,0.85)",
                fontSize: "10px",
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                fontFamily: "var(--font-geist-mono)",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              {t("season", { year: new Date().getFullYear() })}
            </p>
          </div>

          {/* Top-right: item count */}
          <div
            style={{
              position: "absolute",
              top: "clamp(5rem, 9vw, 7rem)",
              right: "clamp(1.5rem, 5vw, 3rem)",
              textAlign: "right",
            }}
          >
            <p
              style={{
                color: "rgba(248,243,232,0.75)",
                fontSize: "10px",
                letterSpacing: "0.3em",
                fontFamily: "var(--font-geist-mono)",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              {products.length} {t("pieces")}
            </p>
          </div>

          {/* Center bottom: headline */}
          <div
            style={{
              position: "absolute",
              bottom: "clamp(4rem, 8vw, 6rem)",
              left: "clamp(1.5rem, 5vw, 3rem)",
              right: "clamp(1.5rem, 5vw, 3rem)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "clamp(0.75rem, 1.5vw, 1.25rem)",
            }}
          >
            {/* Brand + title */}
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-archivo-black), sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.8rem, 8vw, 7.5rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "#F8F3E8",
                  textShadow: "0 2px 10px rgba(0,0,0,0.75), 0 8px 40px rgba(0,0,0,0.5)",
                  marginBottom: "clamp(0.3rem, 0.8vw, 0.6rem)",
                }}
              >
                SHOP
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontStyle: "italic",
                  fontSize: "clamp(1rem, 2.5vw, 2rem)",
                  color: "#D4AF37",
                  letterSpacing: "0.06em",
                  textShadow: "0 1px 6px rgba(0,0,0,0.7), 0 4px 24px rgba(0,0,0,0.5)",
                }}
              >
                Verano Exotico
              </p>
            </div>

            {/* Thin gold rule */}
            <div
              style={{
                width: "clamp(32px, 4vw, 56px)",
                height: "1px",
                background: "linear-gradient(to right, transparent, #D4AF37, transparent)",
                opacity: 0.7,
              }}
            />

            {/* Scroll cue */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <p
                style={{
                  color: "rgba(248,243,232,0.7)",
                  fontSize: "9px",
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-geist-mono)",
                  textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                }}
              >
                {t("scroll")}
              </p>
              <svg
                width="12"
                height="18"
                viewBox="0 0 12 18"
                fill="none"
                style={{
                  animation: "scrollBounce 1.8s ease-in-out infinite",
                  filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))",
                }}
              >
                <path
                  d="M6 0 L6 12 M1 8 L6 13 L11 8"
                  stroke="rgba(248,243,232,0.65)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <style>{`
                @keyframes scrollBounce {
                  0%,100% { transform: translateY(0); opacity:.4; }
                  50%      { transform: translateY(5px); opacity:.75; }
                }
              `}</style>
            </div>
          </div>
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
          <CollectionGrid products={products} locale={locale as Locale} />
        </div>

      </div>
    </ShopShell>
  );
}
