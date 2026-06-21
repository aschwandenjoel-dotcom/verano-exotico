"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/types";
import { products } from "@/lib/products";
import Header from "@/components/ui/Header";

const PanoramaIntro = dynamic(
  () => import("@/components/3d/PanoramaIntro"),
  { ssr: false }
);

interface Props { locale: Locale; }

interface Product {
  number: string;
  category: string;
  title: string;
  name: string;
  desc: string;
  catchphrase: string;
  price: string;
  visual: "pants" | "shirts" | "sweaters";
  slug: string;
}

const PRODUCTS: Product[] = [
  {
    number: "01", category: "PANTS", title: "The Pants", name: "Urban Blueprint",
    desc: "Relaxed bis Wide-Leg. Inspiriert von der Skatekultur der 90er. Robust genug für die Straße, stylish genug für den Club.",
    catchphrase: "Von der Rooftop-Party direkt in den Night-Bus.",
    price: "CHF 149", visual: "pants", slug: "cargo-pants",
  },
  {
    number: "02", category: "SHIRTS", title: "The Shirts", name: "Heavyweight Essentials",
    desc: "240 GSM+ Heavyweight Cotton. Boxy & Bold Fit mit tiefem Schulterfall und engem Kragen.",
    catchphrase: "Deine Leinwand aus Stoff. Formstabil, egal wie heiß es wird.",
    price: "CHF 69", visual: "shirts", slug: "heavy-logo-tee",
  },
  {
    number: "03", category: "SWEATERS", title: "The Sweaters", name: "Sunset Layers",
    desc: "Ultra-weiches Fleece-Lining. 'Golden Hour Comfort' für die kühlen Stunden nach einem langen Tag in der City.",
    catchphrase: "Der Hoodie, den man dir definitiv klauen wird.",
    price: "CHF 129", visual: "sweaters", slug: "heavyweight-hoodie",
  },
];

const TICKER_ITEMS = [
  { text: "Golden Days, Timeless Wear", accent: false },
  { text: "★ Verano Exotico ★ SS25", accent: true },
  { text: "Streetwear for Eternity", accent: false },
  { text: "Golden Days, Timeless Wear", accent: false },
  { text: "★ Verano Exotico ★ SS25", accent: true },
  { text: "Streetwear for Eternity", accent: false },
  // duplicated for seamless loop
  { text: "Golden Days, Timeless Wear", accent: false },
  { text: "★ Verano Exotico ★ SS25", accent: true },
  { text: "Streetwear for Eternity", accent: false },
  { text: "Golden Days, Timeless Wear", accent: false },
  { text: "★ Verano Exotico ★ SS25", accent: true },
  { text: "Streetwear for Eternity", accent: false },
];


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

/* ─── Product visual placeholders ───────────────────────────────── */
function ProductVisual({ type }: { type: Product["visual"] }) {
  if (type === "pants") {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: "#0A3D52" }}>
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,180,197,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,197,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute"
          style={{ width: "200%", height: "3px", background: "#D4AF37", top: "38%", left: "-50%", transform: "rotate(-12deg)", opacity: 0.7 }}
        />
        <div
          className="absolute"
          style={{ width: "200%", height: "1px", background: "#D4AF37", top: "44%", left: "-50%", transform: "rotate(-12deg)", opacity: 0.3 }}
        />
        <span
          className="absolute bottom-5 left-5 text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}
        >
          URBAN BLUEPRINT
        </span>
        <span
          className="absolute top-4 right-5 font-black opacity-[0.07] select-none leading-none"
          style={{ fontSize: "10rem", color: "#E4F4F7", fontFamily: "var(--font-archivo-black), sans-serif" }}
        >
          01
        </span>
      </div>
    );
  }

  if (type === "shirts") {
    return (
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center"
        style={{ background: "#0A3D52" }}
      >
        <span
          className="absolute font-black select-none leading-none opacity-[0.07]"
          style={{ fontSize: "7rem", color: "#E4F4F7", fontFamily: "var(--font-archivo-black), sans-serif", letterSpacing: "-0.04em", transform: "rotate(-4deg)" }}
        >
          240<br />GSM
        </span>
        {[30, 50, 70].map((top) => (
          <div key={top} className="absolute w-full" style={{ top: `${top}%`, height: "1px", background: "rgba(228,244,247,0.08)" }} />
        ))}
        <div className="absolute" style={{ width: "1px", height: "40px", background: "#D4AF37", opacity: 0.6 }} />
        <div className="absolute" style={{ width: "40px", height: "1px", background: "#D4AF37", opacity: 0.6 }} />
        <span
          className="absolute bottom-5 left-5 text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}
        >
          HEAVYWEIGHT
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #00B4C5 0%, #2E7D5E 55%, #0A3D52 100%)" }}
    >
      {[20, 40, 60, 80].map((top, i) => (
        <div key={top} className="absolute w-full" style={{ top: `${top}%`, height: `${12 + i * 4}px`, background: "rgba(0,0,0,0.12)" }} />
      ))}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "150px",
          mixBlendMode: "overlay",
        }}
      />
      <span
        className="absolute bottom-5 left-5 text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "#F8F3E8", fontFamily: "var(--font-geist-mono)", opacity: 0.75 }}
      >
        SUNSET LAYERS
      </span>
      <span
        className="absolute top-4 right-5 font-black opacity-10 select-none leading-none"
        style={{ fontSize: "9rem", color: "#F8F3E8", fontFamily: "var(--font-archivo-black), sans-serif" }}
      >
        03
      </span>
    </div>
  );
}

/* ─── Product Card ───────────────────────────────────────────────── */
function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "3 / 4" }}>
        <ProductVisual type={product.visual} />
        <div
          className="absolute inset-0 flex items-end p-6 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to top, rgba(255,102,53,0.92) 0%, rgba(10,61,82,0.5) 100%)",
            opacity: hovered ? 1 : 0,
          }}
        >
          <p
            className="text-[#F8F3E8] text-xl font-black leading-tight uppercase"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}
          >
            {product.catchphrase}
          </p>
        </div>
      </div>

      <div className="pt-4 pb-6 flex flex-col gap-3" style={{ borderBottom: "1px solid rgba(26,48,64,0.15)" }}>
        <div className="flex items-baseline justify-between">
          <span
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "#00B4C5", fontFamily: "var(--font-geist-mono)" }}
          >
            {product.number} {product.category}
          </span>
          <span className="text-xs font-black" style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}>
            {product.price}
          </span>
        </div>

        <div>
          <p className="text-[10px] tracking-widest uppercase mb-0.5" style={{ color: "rgba(26,48,64,0.4)" }}>{product.title}</p>
          <h3
            className="text-lg font-black uppercase leading-tight"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}
          >
            {product.name}
          </h3>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "rgba(26,48,64,0.6)" }}>{product.desc}</p>

        <Link
          href={`/${locale}/product/${product.slug}`}
          className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.25em] uppercase pb-px hover:opacity-60 transition-opacity w-fit"
          style={{ fontFamily: "var(--font-geist-mono)", color: "#D4AF37", borderBottom: "1px solid #D4AF37" }}
          aria-label={`${product.name} kaufen`}
        >
          Shop now →
        </Link>
      </div>
    </article>
  );
}

/* ─── Shop Card (horizontal scroll) ─────────────────────────────── */
function ShopCard({ product, locale, index }: { product: (typeof products)[0]; locale: Locale; index: number }) {
  const [hovered, setHovered] = useState(false);
  const image = product.images?.[0];
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
            NEU
          </span>
        )}
      </div>
      <p style={{ fontSize: "9px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.18em", textTransform: "uppercase", color: "#00B4C5", marginBottom: "4px" }}>{product.category}</p>
      <p style={{ fontSize: "13px", fontFamily: "var(--font-archivo-black), sans-serif", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", marginBottom: "4px", lineHeight: 1.2 }}>{name}</p>
      <p style={{ fontSize: "13px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.55)" }}>CHF {product.price}</p>
    </Link>
  );
}

/* ─── Newsletter ─────────────────────────────────────────────────── */
function NewsletterInput() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-sm tracking-widest uppercase" style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
        ✓ You&apos;re in. See you in the heat.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 w-full max-w-md">
      <label htmlFor="newsletter-email" className="sr-only">E-Mail-Adresse</label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
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
        className="px-6 py-3 text-[10px] font-black tracking-[0.25em] uppercase transition-colors hover:opacity-80"
        style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px" }}
      >
        Subscribe
      </button>
    </form>
  );
}

/* ─── Main Landing ───────────────────────────────────────────────── */
export default function VTLanding({ locale }: Props) {
  useScrollReveal();

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
            Sommer {new Date().getFullYear()}
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
              SS25 · Sommer Kollektion
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", lineHeight: 0.92, margin: 0 }}>
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
            Kleidung, die sich gut anfühlt. Nicht gut aussieht auf Instagram,
            sondern gut anfühlt im echten Leben.{" "}
            <em style={{ color: "#D4AF37", fontFamily: "var(--font-dm-serif)" }}>Golden Days</em>
            {" "}und{" "}
            <em style={{ color: "#D4AF37", fontFamily: "var(--font-dm-serif)" }}>Timeless Wear</em>{" "}
            sind keine Versprechen. Es ist unser Massstab.
          </p>
          <Link
            href={`/${locale}/collection`}
            className="btn-shimmer inline-flex items-center gap-3 text-[11px] font-black tracking-[0.25em] uppercase px-7 py-4 hover:opacity-80 transition-opacity"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px" }}
          >
            In den Shop
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
          {TICKER_ITEMS.map((item, i) => (
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
            className="text-[10px] tracking-[0.4em] uppercase mb-8 reveal"
            style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}
          >
            Philosophy
          </p>

          <h2
            className="font-black uppercase leading-tight mb-10 reveal reveal-delay-1"
            style={{
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
              color: "#F8F3E8",
              fontFamily: "var(--font-archivo-black), sans-serif",
            }}
          >
            Die Philosophie
          </h2>

          <div
            className="mx-auto mb-10 reveal reveal-delay-2"
            style={{ width: "40px", height: "2px", background: "#D4AF37" }}
          />

          <p
            className="text-base md:text-lg leading-loose reveal reveal-delay-3"
            style={{ color: "rgba(228,244,247,0.75)", fontFamily: "var(--font-syne)" }}
          >
            <strong style={{ color: "#E4F4F7" }}>Golden Days</strong> ist dieses
            Gefühl an einem langen Sommertag, wenn man einfach nicht nach Hause
            will. <strong style={{ color: "#E4F4F7" }}>Timeless Wear</strong> ist
            die Antwort darauf: Kleidung, die nicht nach einer Saison im Keller
            landet. Wir machen Stücke für echte Menschen, nicht für Lookbooks.
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
              Neue Kollektion
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
            All pieces →
          </Link>
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{ display: "flex", gap: "20px", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "16px", scrollbarWidth: "none", msOverflowStyle: "none" }}
            className="hide-scrollbar"
          >
            {products.map((product, i) => (
              <div key={product.slug} style={{ scrollSnapAlign: "start" }}>
                <ShopCard product={product} locale={locale} index={i} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: "16px", width: "80px", background: "linear-gradient(to left, #F8F3E8, transparent)", pointerEvents: "none" }} />
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
            Manifesto
          </span>
          <blockquote
            className="font-black uppercase leading-[0.92] tracking-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 6rem)", fontFamily: "var(--font-archivo-black), sans-serif" }}
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
              Join the<br />
              <span style={{ color: "#D4AF37" }}>Heat.</span>
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
              Guter Sommer. Gute Klamotten.
            </p>
          </div>

          <nav className="flex items-center gap-6" aria-label="Footer-Navigation">
            {["Impressum", "Datenschutz", "Shop"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[10px] tracking-[0.2em] uppercase transition-colors"
                style={{ color: "rgba(248,243,232,0.35)", fontFamily: "var(--font-geist-mono)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#D4AF37")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,243,232,0.35)")}
              >
                {item}
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
