"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Locale, Product } from "@/types";

const FILTERS = ["all", "new", "bikini", "onepiece", "set"] as const;
type Filter = (typeof FILTERS)[number];

const SORTS = ["default", "newest", "price_asc", "price_desc"] as const;
type Sort = (typeof SORTS)[number];

/** Grobe Einordnung nach Produkt-Typ (aus dem slug abgeleitet). */
function swimType(p: Product): "onepiece" | "set" | "bikini" {
  const s = p.slug;
  if (s.includes("onepiece")) return "onepiece";
  if (s.includes("threepiece") || s.includes("beach-dress-set")) return "set";
  return "bikini";
}

interface Props {
  products: Product[];
  locale: Locale;
  /** Typ-Filter ausblenden (Kategorieseiten sind schon gefiltert). */
  showFilters?: boolean;
}

/* ─── Single card ────────────────────────────────────────────── */
function BershkaCard({
  product,
  locale,
  featured = false,
}: {
  product: Product;
  locale: Locale;
  featured?: boolean;
}) {
  const t = useTranslations("collection");
  const [hovered, setHovered] = useState(false);
  // Farb-Bilder zuerst, dann allgemeine Bilder – ohne Duplikate
  const colorImgs = (product.colorImages ?? []).filter(Boolean);
  const all = [...colorImgs, ...(product.images ?? []).filter((s) => s && !colorImgs.includes(s))];
  // Wie bei H&M: Packshot auf Weiss als Titelbild, beim Überfahren das Model-Bild
  // (Dateinamen <slug>-packshot / <slug>-model, siehe tools/product-images.mjs)
  const title = all.find((s) => s.includes("-packshot")) ?? all[0];
  const hoverImg = all.find((s) => s.includes("-model")) ?? all.find((s) => s !== title);
  const name = product.name[locale];

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ textDecoration: "none" }}
    >
      {/* Image container – Hochformat, damit das Model von Kopf bis Fuss Platz hat */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4 / 5",
          background: "#E8E4DE",
        }}
      >
        {title ? (
          <>
            <Image
              src={title}
              alt={name}
              fill
              sizes={featured
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
              className="object-cover object-center"
              priority={featured}
            />
            {/* Zweites Bild liegt schon geladen darüber und wird beim Überfahren eingeblendet */}
            {hoverImg && (
              <Image
                src={hoverImg}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-center"
                style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.35s ease" }}
              />
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-end justify-center pb-8 gap-2"
            style={{ background: "#E4F4F7" }}
          >
            {product.colors.slice(0, 3).map((c, i) => (
              <div key={c} style={{ background: c, width: 32, height: 48 + i * 20, opacity: 0.85 }} />
            ))}
          </div>
        )}

        {/* NEW badge */}
        {product.isNew && (
          <span
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "#D4AF37",
              color: "#1A3040",
              fontSize: "9px",
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              padding: "4px 8px",
              zIndex: 10,
            }}
          >
            NEU
          </span>
        )}
      </div>

      {/* Product info */}
      <div style={{ padding: "12px 2px 0" }}>
        {/* Color swatches */}
        {product.colors.length > 0 && (
          <div style={{ display: "flex", gap: "5px", marginBottom: "8px", flexWrap: "wrap" }}>
            {product.colors.slice(0, 6).map((color) => (
              <div
                key={color}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: color,
                  border: "1px solid rgba(26,48,64,0.15)",
                }}
              />
            ))}
            {product.colors.length > 6 && (
              <span style={{ fontSize: "9px", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)", lineHeight: "12px" }}>
                +{product.colors.length - 6}
              </span>
            )}
          </div>
        )}

        <p
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#D4AF37",
            fontFamily: "var(--font-geist-mono)",
            marginBottom: "3px",
          }}
        >
          {swimType(product) === "onepiece" ? t("type_onepiece") : swimType(product) === "set" ? t("type_set") : t("type_bikini")}
        </p>
        <p
          style={{
            fontSize: featured ? "14px" : "12px",
            fontFamily: "var(--font-archivo-black), sans-serif",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            color: "#1A3040",
            marginBottom: "4px",
            lineHeight: 1.2,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontSize: "13px",
            fontFamily: "var(--font-geist-mono)",
            color: "#1A3040",
            fontWeight: featured ? 700 : 400,
          }}
        >
          CHF {product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

/* ─── Main grid ──────────────────────────────────────────────── */
export default function CollectionGrid({ products, locale, showFilters = true }: Props) {
  const t = useTranslations("collection");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("default");

  const filtered = products.filter((p) => {
    if (filter === "all") return true;
    if (filter === "new") return p.isNew;
    return swimType(p) === filter;
  });

  // Produkte kommen aus der DB nach created_at aufsteigend (älteste zuerst)
  const sorted = [...filtered];
  if (sort === "newest") sorted.reverse();
  if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);

  return (
    <>
      {/* ── Filter strip ─────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: "64px",
          zIndex: 40,
          background: "#F8F3E8",
          borderBottom: "1px solid rgba(26,48,64,0.08)",
          padding: "0 clamp(1.5rem, 5vw, 2.5rem)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: "1px",
          }}
        >
          {/* Filter pills */}
          {showFilters && (
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: "10px 18px",
                  fontSize: "10px",
                  fontFamily: "var(--font-geist-mono)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  background: filter === f ? "#1A3040" : "transparent",
                  color: filter === f ? "#F8F3E8" : "rgba(26,48,64,0.5)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {t(`filter_${f}`)}
              </button>
            ))}
          </div>
          )}

          {/* Sort + item count */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sortierung"
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(26,48,64,0.6)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>{t(`sort_${s}`)}</option>
              ))}
            </select>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-geist-mono)",
                color: "rgba(26,48,64,0.35)",
                letterSpacing: "0.1em",
                paddingRight: "4px",
              }}
            >
              {filtered.length} {t("pieces")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────── */}
      <div style={{ padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 5vw, 2.5rem) 4rem" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {t("empty")}
          </div>
        ) : (
          <div
            style={{ display: "grid", gap: "clamp(8px, 2vw, 16px)" }}
            className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {sorted.map((product) => (
              <div key={product.slug}>
                <BershkaCard product={product} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
