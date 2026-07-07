"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import type { Locale, Product as ShopProduct } from "@/types";
import Header from "@/components/ui/Header";

const PanoramaIntro = dynamic(
  () => import("@/components/3d/PanoramaIntro"),
  { ssr: false }
);

interface Props { locale: Locale; products: ShopProduct[]; }

// Slogan bleibt in beiden Sprachen gleich; nur die Kategorien-Zeile wird übersetzt
function tickerItems(categories: string) {
  const block = [
    { text: "Golden Days, Timeless Wear", accent: false },
    { text: "★ Verano Exotico ★", accent: true },
    { text: categories, accent: false },
  ];
  // duplicated for seamless loop
  return [...block, ...block, ...block, ...block];
}


/* ─── Scroll reveal hook ─────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Shop Card (horizontal scroll) ─────────────────────────────── */
function ShopCard({ product, locale, index, badgeNew }: { product: ShopProduct; locale: Locale; index: number; badgeNew: string }) {
  const [hovered, setHovered] = useState(false);
  const image = product.colorImages?.[0] ?? product.images?.[0];
  const name = product.name[locale];

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      style={{
        flexShrink: 0, width: "520px", display: "block", textDecoration: "none",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: "relative", aspectRatio: "1/1", background: "#EDE9E2", overflow: "hidden", marginBottom: "14px" }}>
        {image ? (
          <Image src={image} alt={name} fill sizes="520px" style={{ objectFit: "contain" }} priority={index < 2} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {product.colors.slice(0, 3).map((c, i) => (
              <div key={c} style={{ background: c, width: 32, height: 48 + i * 16, margin: "0 4px", opacity: 0.85 }} />
            ))}
          </div>
        )}
        {product.isNew && (
          <span style={{ position: "absolute", top: "10px", left: "10px", background: "#D4AF37", color: "#1A3040", fontSize: "9px", fontFamily: "var(--font-archivo-black), sans-serif", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", padding: "3px 8px" }}>
            {badgeNew}
          </span>
        )}
      </div>
      <p style={{ fontSize: "9px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.18em", textTransform: "uppercase", color: "#00B4C5", marginBottom: "4px" }}>{product.category}</p>
      <p style={{ fontSize: "13px", fontFamily: "var(--font-archivo-black), sans-serif", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", marginBottom: "4px", lineHeight: 1.2 }}>{name}</p>
      <p style={{ fontSize: "13px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.55)" }}>CHF {product.price.toFixed(2)}</p>
    </Link>
  );
}

/* ─── Newsletter ─────────────────────────────────────────────────── */
function NewsletterInput() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      if (res.ok) setSubmitted(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm tracking-widest uppercase" style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
        ✓ {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 w-full max-w-md">
      <label htmlFor="newsletter-email" className="sr-only">{t("placeholder")}</label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder")}
        required
        className="flex-1 bg-transparent px-4 py-3 text-sm outline-none transition-colors"
        style={{
          border: "1px solid rgba(248,243,232,0.3)",
          color: "#F8F3E8",
          fontFamily: "var(--font-geist-mono)",
          minHeight: "44px",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#D4AF37")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(248,243,232,0.3)")}
      />
      <button
        type="submit"
        disabled={sending}
        className="px-6 py-3 text-[10px] font-black tracking-[0.25em] uppercase transition-colors hover:opacity-80"
        style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px", opacity: sending ? 0.7 : 1 }}
      >
        {sending ? "…" : t("submit")}
      </button>
      {failed && (
        <p className="text-[11px] sm:self-center sm:ml-3 mt-2 sm:mt-0" style={{ color: "#E8A0A0", fontFamily: "var(--font-geist-mono)" }}>
          {t("error")}
        </p>
      )}
    </form>
  );
}

/* ─── Main Landing ───────────────────────────────────────────────── */
export default function VTLanding({ locale, products }: Props) {
  useScrollReveal();
  const t = useTranslations("landing");
  const tf = useTranslations("footer");
  const tn = useTranslations("nav");
  const year = new Date().getFullYear();
  const shopScrollRef = useRef<HTMLDivElement>(null);
  const scrollShop = (dir: number) =>
    shopScrollRef.current?.scrollBy({ left: dir * 540, behavior: "smooth" });

  return (
    <div className="min-h-screen" style={{ background: "#F8F3E8", color: "#1A3040" }}>
      <PanoramaIntro />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <Header locale={locale} />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="pt-20 min-h-screen px-6 md:px-10 pb-12"
        style={{ borderBottom: "1px solid rgba(26,48,64,0.1)", position: "relative", overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr auto" }}
      >
        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "clamp(3rem,8vw,5rem)" }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)" }}>
            {t("season", { year })}
          </span>
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)" }}>
            Golden Days, Timeless Wear
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: "40px 0" }}>
          <div style={{ marginBottom: "28px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(26,48,64,0.06)", borderRadius: "9999px", padding: "6px 16px", fontSize: "10px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(26,48,64,0.5)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
              {t("badge", { year })}
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", lineHeight: 1.0, margin: 0 }}>
            <span className="hero-word" style={{ display: "block", fontSize: "clamp(2.8rem, 9vw, 9rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#1A3040" }}>
              Golden Days,
            </span>
            <span className="hero-word" style={{ display: "block", fontSize: "clamp(2.8rem, 9vw, 9rem)", fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#D4AF37", textTransform: "none", letterSpacing: "-0.02em" }}>
              Timeless Wear.
            </span>
          </h1>
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
            className="font-black uppercase leading-tight mb-10 reveal reveal-delay-1"
            style={{
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
              color: "#F8F3E8",
              fontFamily: "var(--font-archivo-black), sans-serif",
            }}
          >
            {t("philosophy_title")}
          </h2>

          <div
            className="mx-auto mb-10 reveal reveal-delay-2"
            style={{ width: "40px", height: "2px", background: "#D4AF37" }}
          />

          <p
            className="text-base md:text-lg leading-loose reveal reveal-delay-3"
            style={{ color: "rgba(228,244,247,0.75)", fontFamily: "var(--font-syne)" }}
          >
            <strong style={{ color: "#E4F4F7" }}>Golden Days</strong>
            {t("phil_1")}
            <strong style={{ color: "#E4F4F7" }}>Timeless Wear</strong>
            {t("phil_2")}
          </p>
        </div>
      </section>

      {/* ── PRODUCT GRID ────────────────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-20"
        style={{ borderBottom: "1px solid rgba(26,48,64,0.1)" }}
      >
        <div className="flex items-end justify-between mb-12 pb-4 reveal" style={{ borderBottom: "1px solid rgba(26,48,64,0.15)" }}>
          <div>
            <p
              className="text-[10px] tracking-[0.35em] uppercase mb-1"
              style={{ color: "#00B4C5", fontFamily: "var(--font-geist-mono)" }}
            >
              {t("new_collection")}
            </p>
            <h2
              className="font-black uppercase text-3xl md:text-4xl"
              style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}
            >
              Shop
            </h2>
          </div>
          <Link
            href={`/${locale}/collection`}
            className="hidden md:block text-[10px] tracking-[0.25em] uppercase transition-colors pb-px"
            style={{ color: "rgba(26,48,64,0.5)", fontFamily: "var(--font-geist-mono)", borderBottom: "1px solid transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#1A3040";
              e.currentTarget.style.borderBottomColor = "#1A3040";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(26,48,64,0.5)";
              e.currentTarget.style.borderBottomColor = "transparent";
            }}
          >
            {t("all_pieces")}
          </Link>
        </div>

        <div style={{ position: "relative" }}>
          <div
            ref={shopScrollRef}
            style={{ display: "flex", gap: "20px", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "16px", scrollbarWidth: "none", msOverflowStyle: "none" }}
            className="hide-scrollbar"
          >
            {products.map((product, i) => (
              <div key={product.slug} style={{ scrollSnapAlign: "start" }}>
                <ShopCard product={product} locale={locale} index={i} badgeNew={t("badge_new")} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: "16px", width: "80px", background: "linear-gradient(to left, #F8F3E8, transparent)", pointerEvents: "none" }} />

          {/* Scroll-Pfeile */}
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir < 0 ? t("aria_prev") : t("aria_next")}
              onClick={() => scrollShop(dir)}
              className="hidden md:flex items-center justify-center"
              style={{
                position: "absolute",
                top: "calc(50% - 30px)",
                [dir < 0 ? "left" : "right"]: "8px",
                transform: "translateY(-50%)",
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                background: "#F8F3E8",
                color: "#1A3040",
                border: "1px solid rgba(26,48,64,0.15)",
                boxShadow: "0 2px 10px rgba(26,48,64,0.15)",
                cursor: "pointer",
                zIndex: 5,
                fontSize: "18px",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1A3040"; e.currentTarget.style.color = "#F8F3E8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F8F3E8"; e.currentTarget.style.color = "#1A3040"; }}
            >
              {dir < 0 ? "‹" : "›"}
            </button>
          ))}
        </div>
      </section>

      {/* ── EDITORIAL STATEMENT ─────────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-20 md:py-28"
        style={{ borderBottom: "1px solid rgba(26,48,64,0.1)" }}
      >
        <div className="max-w-4xl reveal">
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

      {/* ── NEWSLETTER / FOOTER ─────────────────────────────────── */}
      <footer style={{ background: "#0A3D52" }}>
        <div
          className="px-6 md:px-10 py-20 border-b relative overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px",
            }}
            aria-hidden="true"
          />
          <div className="max-w-2xl relative reveal">
            <p
              className="text-[10px] tracking-[0.35em] uppercase mb-4"
              style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}
            >
              Newsletter
            </p>
            <h2
              className="font-black uppercase leading-tight mb-8"
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", color: "#F8F3E8", fontFamily: "var(--font-archivo-black), sans-serif" }}
            >
              {t("newsletter_title_1")}<br />
              <span style={{ color: "#D4AF37" }}>{t("newsletter_title_2")}</span>
            </h2>
            <NewsletterInput />
          </div>
        </div>

        <div className="px-6 md:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-black tracking-[0.2em] uppercase mb-1"
              style={{ color: "#F8F3E8", fontFamily: "var(--font-archivo-black), sans-serif" }}
            >
              VERANO EXOTICO
            </p>
            <p className="text-[10px]" style={{ color: "rgba(248,243,232,0.35)", fontFamily: "var(--font-geist-mono)" }}>
              {t("footer_tagline")}
            </p>
          </div>

          <nav className="flex items-center gap-6 flex-wrap" aria-label="Footer-Navigation">
            {[
              { label: tn("collection"), href: `/${locale}/collection` },
              { label: tf("links_shipping"), href: `/${locale}/versand` },
              { label: tf("links_terms"), href: `/${locale}/agb` },
              { label: tf("links_legal"), href: `/${locale}/impressum` },
              { label: tf("links_privacy"), href: `/${locale}/datenschutz` },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[10px] tracking-[0.2em] uppercase transition-colors"
                style={{ color: "rgba(248,243,232,0.35)", fontFamily: "var(--font-geist-mono)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#D4AF37")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,243,232,0.35)")}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <p className="text-[10px]" style={{ color: "rgba(248,243,232,0.2)", fontFamily: "var(--font-geist-mono)" }}>
            © {new Date().getFullYear()} Verano Exotico
          </p>
        </div>
      </footer>
    </div>
  );
}
