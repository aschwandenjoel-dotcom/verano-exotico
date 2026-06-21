"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale, Product } from "@/types";

const FILTERS = [
  { key: "all",     label: "Alle"  },
  { key: "new",     label: "Neu"   },
  { key: "tops",    label: "Tops"  },
  { key: "bottoms", label: "Hosen" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

interface Props {
  products: Product[];
  locale: Locale;
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
  const [hovered, setHovered] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images ?? [];
  const name = product.name[locale];

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActiveImg(0); }}
      style={{ textDecoration: "none" }}
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          background: "#E8E4DE",
        }}
      >
        {images.length > 0 ? (
          <Image
            src={images[activeImg]}
            alt={name}
            fill
            sizes={featured
              ? "(max-width: 768px) 100vw, 66vw"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            className="object-contain"
            style={{
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
            priority={featured}
          />
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

        {/* Hover overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(26,48,64,0.18)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "20px",
          }}
        >
          <span
            style={{
              background: "#F8F3E8",
              color: "#1A3040",
              fontSize: "10px",
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "10px 24px",
              transform: hovered ? "translateY(0)" : "translateY(8px)",
              transition: "transform 0.3s ease",
            }}
          >
            Ansehen
          </span>
        </div>

        {/* Image switcher dots on hover */}
        {images.length > 1 && hovered && (
          <div
            className="absolute top-3 left-0 right-0 flex justify-center gap-1.5"
            style={{ zIndex: 10 }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); setActiveImg(i); }}
                style={{
                  width: i === activeImg ? "20px" : "6px",
                  height: "2px",
                  background: i === activeImg ? "#F8F3E8" : "rgba(248,243,232,0.5)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: 0,
                }}
              />
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
          {product.category}
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
          CHF {product.price}
        </p>
      </div>
    </Link>
  );
}

/* ─── Main grid ──────────────────────────────────────────────── */
export default function CollectionGrid({ products, locale }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = products.filter((p) => {
    if (filter === "all") return true;
    if (filter === "new") return p.isNew;
    return p.category === filter;
  });

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
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "10px 18px",
                  fontSize: "10px",
                  fontFamily: "var(--font-geist-mono)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  background: filter === f.key ? "#1A3040" : "transparent",
                  color: filter === f.key ? "#F8F3E8" : "rgba(26,48,64,0.5)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Item count */}
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-geist-mono)",
              color: "rgba(26,48,64,0.35)",
              letterSpacing: "0.1em",
              flexShrink: 0,
              paddingRight: "4px",
            }}
          >
            {filtered.length} Stücke
          </span>
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────── */}
      <div style={{ padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 5vw, 2.5rem) 4rem" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)", fontSize: "12px", letterSpacing: "0.15em" }}>
            KEINE PRODUKTE
          </div>
        ) : (
          <div
            style={{ display: "grid", gap: "clamp(8px, 2vw, 16px)" }}
            className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {filtered.map((product) => (
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
