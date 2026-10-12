"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types";

// Slogan bleibt in beiden Sprachen gleich; nur die Kategorien-Zeile wird übersetzt
function tickerItems(categories: string) {
  const block = [
    { text: "Golden Days, Timeless Wear", accent: false },
    { text: "★ Verano Exotico ★", accent: true },
    { text: categories, accent: false },
  ];
  // verdoppelt für eine nahtlose Schleife
  return [...block, ...block, ...block, ...block];
}

/**
 * Seite "Philosophie": die Abschnitte, die früher auf der Startseite standen
 * (grosser Schriftzug, Laufband, Philosophie, Manifest, Markensatz).
 */
export default function Philosophy({ locale }: { locale: Locale }) {
  const t = useTranslations("landing");
  const tp = useTranslations("philosophy");
  const year = new Date().getFullYear();
  return (
    <div style={{ background: "#F8F3E8", color: "#1A3040" }}>
      {/* ── HERO ────────────────────────────────────────────────── */}
        <section
          className="px-6 md:px-10 pt-16 md:pt-20 pb-12"
          style={{ borderBottom: "1px solid rgba(26,48,64,0.1)", position: "relative", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto auto" }}
        >
          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "clamp(3rem,8vw,5rem)" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)" }}>
              {t("season", { year })}
            </span>
            <h1 style={{ fontSize: "10px", fontWeight: 400, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)", margin: 0 }}>
              {tp("h1")}
            </h1>
          </div>
  
          {/* Headline */}
          <div style={{ padding: "40px 0" }}>
            <div style={{ marginBottom: "28px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(26,48,64,0.06)", borderRadius: "9999px", padding: "6px 16px", fontSize: "10px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(26,48,64,0.5)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
                {t("badge", { year })}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-archivo-black), sans-serif", lineHeight: 1.0, margin: 0 }}>
              <span className="hero-word" style={{ display: "block", fontSize: "clamp(2.8rem, 9vw, 9rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#1A3040" }}>
                Golden Days,
              </span>
              <span className="hero-word" style={{ display: "block", fontSize: "clamp(2.8rem, 9vw, 9rem)", fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#D4AF37", textTransform: "none", letterSpacing: "-0.02em" }}>
                Timeless Wear.
              </span>
            </p>
          </div>
  
          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <p className="text-sm max-w-sm leading-relaxed md:max-w-xs" style={{ color: "rgba(26,48,64,0.65)", fontFamily: "var(--font-syne)" }}>
              {t("hero_sub_1")}
              <em style={{ color: "#D4AF37", fontFamily: "var(--font-dm-serif)" }}>Golden Days</em>
              {t("hero_sub_2")}
              <em style={{ color: "#D4AF37", fontFamily: "var(--font-dm-serif)" }}>Timeless Wear</em>
              {t("hero_sub_3")}
            </p>
            <Link
              href={`/${locale}/collection`}
              className="btn-shimmer inline-flex items-center gap-3 text-[11px] font-black tracking-[0.25em] uppercase px-7 py-4 hover:opacity-80 transition-opacity"
              style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px" }}
            >
              {t("cta_shop")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
  
        {/* ── TICKER STRIP ────────────────────────────────────────── */}
        <div className="overflow-hidden py-3" style={{ background: "#1A3040" }}>
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{ animation: "marquee 22s linear infinite" }}
            aria-hidden="true"
          >
            {tickerItems(t("ticker_categories")).map((item, i) => (
              <span
                key={i}
                className="text-[10px] tracking-[0.3em] uppercase shrink-0"
                style={{ color: item.accent ? "#F8F3E8" : "rgba(248,243,232,0.7)", fontFamily: "var(--font-geist-mono)" }}
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
  
        {/* ── PHILOSOPHY ──────────────────────────────────────────── */}
        <section
          className="px-6 md:px-10 py-24 md:py-36 relative overflow-hidden"
          style={{ background: "#0A3D52", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px",
              mixBlendMode: "overlay",
            }}
            aria-hidden="true"
          />
  
          <div className="max-w-3xl mx-auto text-center relative">
            <p
              className="tracking-[0.4em] uppercase mb-8"
              style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)", fontSize: "13px" }}
            >
              {t("philosophy_eyebrow")}
            </p>
  
            <h2
              className="font-black uppercase leading-tight mb-10"
              style={{
                fontSize: "clamp(2rem, 5vw, 4.5rem)",
                color: "#F8F3E8",
                fontFamily: "var(--font-archivo-black), sans-serif",
              }}
            >
              {t("philosophy_title")}
            </h2>
  
            <div
              className="mx-auto mb-10"
              style={{ width: "40px", height: "2px", background: "#D4AF37" }}
            />
  
            <p
              className="text-base md:text-lg leading-loose"
              style={{ color: "rgba(228,244,247,0.75)", fontFamily: "var(--font-syne)" }}
            >
              <strong style={{ color: "#E4F4F7" }}>Golden Days</strong>
              {t("phil_1")}
              <strong style={{ color: "#E4F4F7" }}>Timeless Wear</strong>
              {t("phil_2")}
            </p>
          </div>
        </section>
  
        {/* ── EDITORIAL STATEMENT ─────────────────────────────────── */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ borderBottom: "1px solid rgba(26,48,64,0.1)" }}
        >
          <div className="max-w-4xl">
            <span
              className="text-[10px] tracking-[0.35em] uppercase block mb-6"
              style={{ color: "#00B4C5", fontFamily: "var(--font-geist-mono)" }}
            >
              {t("manifest_eyebrow")}
            </span>
            <blockquote
              className="font-black uppercase leading-none tracking-tight"
              style={{ fontSize: "clamp(2rem, 6vw, 6rem)", fontFamily: "var(--font-archivo-black), sans-serif", lineHeight: 1.05 }}
            >
              <span className="block">Trends are</span>
              <span
                className="block"
                style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#00B4C5", textTransform: "none" }}
              >
                temporary.
              </span>
              <span className="block">We are not.</span>
            </blockquote>
          </div>
        </section>
  
        {/* ── MARKENSATZ (wie bei Hunza G zentriert vor dem Footer) ── */}
        <section className="px-6 md:px-10 py-20 md:py-28">
          <p
            className="mx-auto max-w-3xl text-center text-base md:text-xl leading-relaxed"
            style={{ color: "rgba(26,48,64,0.8)", fontFamily: "var(--font-syne)" }}
          >
            <strong style={{ color: "#1A3040" }}>Golden Days</strong>
            {t("phil_1")}
            <strong style={{ color: "#1A3040" }}>Timeless Wear</strong>
            {t("phil_2")}
          </p>
        </section>
  
    </div>
  );
}
