"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import type { Locale, Product as ShopProduct } from "@/types";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import CustomerVoices from "@/components/ui/CustomerVoices";
import { ProductTile } from "@/components/sections/CollectionGrid";
import { getCategory } from "@/lib/categories";
import { cardImages, isAiImage } from "@/lib/productImages";
import AiBadge from "@/components/ui/AiBadge";

interface Props { locale: Locale; bestsellers: ShopProduct[]; bikinis: ShopProduct[]; swimsuits: ShopProduct[]; }

/* ─── Scroll reveal hook ─────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
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
    const vh = window.innerHeight;
    els.forEach((el) => {
      // Was beim Start schon im Bild ist, bleibt sichtbar - sonst wuerde es
      // beim Einschalten der Ausblendung kurz verschwinden.
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("visible");
      else observer.observe(el);
    });
    // Erst ab hier blendet globals.css die .reveal-Elemente aus. Ohne diese
    // Klasse (kein JavaScript, Skript haengt) bleibt alles sichtbar.
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
}

/* ─── Produktreihe: Titel, "Alle ansehen", Raster ─────────────────── */
function ProductRow({
  locale, products, title, href, linkLabel, heading,
}: {
  locale: Locale;
  products: ShopProduct[];
  title: string;
  href: string;
  linkLabel: string;
  heading?: React.ReactNode;
}) {
  if (products.length === 0) return null;
  return (
    <section className="px-6 md:px-10 pt-16 md:pt-20 pb-16">
      <div className="flex items-end justify-between mb-8 reveal">
        <div>
          {heading}
          <h2 className="font-black uppercase text-2xl md:text-3xl" style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}>
            {title}
          </h2>
        </div>
        <Link
          href={href}
          className="text-[10px] tracking-[0.25em] uppercase whitespace-nowrap underline underline-offset-4"
          style={{ color: "#1A3040", fontFamily: "var(--font-geist-mono)" }}
        >
          {linkLabel}
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "clamp(8px, 2vw, 16px)" }}>
        {products.map((product) => (
          <ProductTile key={product.slug} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}

/* ─── Main Landing ───────────────────────────────────────────────── */
export default function VTLanding({ locale, bestsellers, bikinis, swimsuits }: Props) {
  useScrollReveal();
  const t = useTranslations("landing");
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen" style={{ background: "#F8F3E8", color: "#1A3040" }}>
      {/* ── TITELBILD (bildschirmhoch, Header darüber durchsichtig) ── */}
      <section className="relative overflow-hidden" style={{ height: "100svh", minHeight: "520px" }}>
        <Image
          src="/images/home-hero-leopard-2.jpg"
          alt="Verano Exotico – Bikini mit Animal-Print vor blauer Wand"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 25%" }}
        />
        <AiBadge inset={16} />
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,25,35,0.35) 0%, rgba(5,25,35,0) 22%, rgba(5,25,35,0) 58%, rgba(5,25,35,0.5) 100%)" }}
        />
        {/* dezent unten links, damit das Model in der Mitte frei bleibt */}
        <div className="absolute left-6 md:left-10 bottom-10 md:bottom-14" style={{ color: "#F8F3E8", maxWidth: "520px" }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
            {t("season", { year })}
          </p>
          <p style={{ fontFamily: "var(--font-archivo-black), sans-serif", lineHeight: 1.0, margin: 0 }}>
            <span style={{ display: "block", fontSize: "clamp(1.8rem, 4vw, 3.4rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
              Golden Days,
            </span>
            <span style={{ display: "block", fontSize: "clamp(1.8rem, 4vw, 3.4rem)", fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#D4AF37" }}>
              Timeless Wear.
            </span>
          </p>
          <Link
            href={`/${locale}/collection`}
            className="mt-6 inline-flex items-center text-[11px] font-black tracking-[0.25em] uppercase px-7 py-4"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif", border: "1.5px solid #F8F3E8", color: "#F8F3E8", minHeight: "44px" }}
          >
            {t("cta_shop")}
          </Link>
        </div>
      </section>
      {/* Ab hier ist das Titelbild vorbei – der Header wird dunkelblau */}
      <div data-header-solid-from aria-hidden="true" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <Header locale={locale} transparentAtTop />

      {/* Aufbau nach Hunza G: Titelbild → Bestseller → Bikinis → zwei Bildkacheln
          → Badeanzüge → Kundenstimmen → Kampagnenbild → Footer */}

      {/* ── BESTSELLER: zwei grosse Kacheln mit Model-Bildern ───── */}
      {bestsellers.length > 0 && (
        <section className="pt-16 md:pt-20">
          <h2
            className="px-6 md:px-10 mb-8 font-black uppercase text-2xl md:text-3xl reveal"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}
          >
            {t("bestsellers")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {bestsellers.map((product) => {
              const src = (product.images ?? []).find((s) => s.includes("-model")) ?? cardImages(product).title;
              return (
                <Link
                  key={product.slug}
                  href={`/${locale}/product/${product.slug}`}
                  className="group relative block overflow-hidden"
                  style={{ aspectRatio: "4/5", background: "#EDE9E2" }}
                >
                  {src && (
                    <Image
                      src={src}
                      alt={product.name[locale]}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="transition-transform duration-700 group-hover:scale-[1.03]"
                      style={{ objectFit: "cover", objectPosition: "center top" }}
                    />
                  )}
                  <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,25,35,0.45), rgba(5,25,35,0) 40%)" }} />
                  {isAiImage(src) && <AiBadge inset={16} />}
                  <span className="absolute left-6 md:left-10 bottom-8 md:bottom-10" style={{ color: "#F8F3E8" }}>
                    <span
                      className="block text-[13px] tracking-[0.2em] uppercase underline underline-offset-[6px]"
                      style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}
                    >
                      {product.name[locale]}
                    </span>
                    <span className="block mt-3 text-sm" style={{ fontFamily: "var(--font-geist-mono)" }}>
                      CHF {product.price.toFixed(2)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── BIKINIS ─────────────────────────────────────────────── */}
      <ProductRow
        locale={locale}
        products={bikinis}
        title={getCategory("bikinis")![locale].label}
        href={`/${locale}/bikinis`}
        linkLabel={t("view_all")}
        heading={
          // h1 für Google – das Panorama hat keine Überschrift
          <h1
            className="text-[10px] tracking-[0.3em] uppercase mb-2"
            style={{ color: "rgba(26,48,64,0.5)", fontFamily: "var(--font-geist-mono)", fontWeight: 400 }}
          >
            {t("seo_h1")}
          </h1>
        }
      />

      {/* ── ZWEI BILDKACHELN ────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        {[
          // Model-Bilder: eine im Bikini, eine im Badeanzug
          { href: `/${locale}/bikinis`, label: t("tile_bikinis"), src: "/products/brisa-strappy-bikini-model.jpg", pos: "center top" },
          { href: `/${locale}/badeanzuege`, label: t("tile_swimsuits"), src: "/products/roma-onepiece-swimsuit-model.jpg", pos: "center top" },
        ].map((tile) => (
          <Link key={tile.href} href={tile.href} className="group relative block overflow-hidden" style={{ aspectRatio: "4/5" }}>
            <Image
              src={tile.src}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ objectFit: "cover", objectPosition: tile.pos }}
            />
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,25,35,0.45), rgba(5,25,35,0) 45%)" }} />
            {isAiImage(tile.src) && <AiBadge inset={16} />}
            <span
              className="absolute left-6 md:left-10 bottom-8 md:bottom-10 text-[13px] tracking-[0.2em] uppercase underline underline-offset-[6px]"
              style={{ color: "#F8F3E8", fontFamily: "var(--font-archivo-black), sans-serif" }}
            >
              {tile.label}
            </span>
          </Link>
        ))}
      </section>

      {/* ── BADEANZÜGE ──────────────────────────────────────────── */}
      <ProductRow
        locale={locale}
        products={swimsuits}
        title={getCategory("badeanzuege")![locale].label}
        href={`/${locale}/badeanzuege`}
        linkLabel={t("view_all")}
      />

      {/* ── KUNDENSTIMMEN ───────────────────────────────────────── */}
      {/* Laufende Kommentarboxen. Rendert nichts, solange
          src/data/customer-voices.json leer ist (node tools/cj-reviews.mjs). */}
      <CustomerVoices locale={locale} variant="marquee" />

      {/* ── KAMPAGNE ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "min(85vh, 760px)" }}>
        {/* Model rechts, links freier Himmel für den Text */}
        <Image src="/images/about/meer.jpg" alt="" fill sizes="100vw" style={{ objectFit: "cover", objectPosition: "70% center" }} />
        <AiBadge inset={16} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,25,35,0.6), rgba(5,25,35,0.1) 60%)" }} />
        <div className="relative px-6 md:px-16 flex flex-col justify-center reveal" style={{ minHeight: "min(85vh, 760px)", maxWidth: "720px" }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-5" style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
            {t("season", { year })}
          </p>
          <p style={{ fontFamily: "var(--font-archivo-black), sans-serif", lineHeight: 1.0, margin: 0 }}>
            <span style={{ display: "block", fontSize: "clamp(2.4rem, 6vw, 5.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F8F3E8" }}>
              Golden Days,
            </span>
            <span style={{ display: "block", fontSize: "clamp(2.4rem, 6vw, 5.5rem)", fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#D4AF37", letterSpacing: "-0.02em" }}>
              Timeless Wear.
            </span>
          </p>
          <p className="mt-6 text-sm md:text-base max-w-md" style={{ color: "rgba(248,243,232,0.85)", fontFamily: "var(--font-syne)" }}>
            {t("hero_sub_1")}
          </p>
          <Link
            href={`/${locale}/about`}
            className="mt-8 self-start inline-flex items-center text-[11px] font-black tracking-[0.25em] uppercase px-7 py-4 transition-colors"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif", border: "1.5px solid #F8F3E8", color: "#F8F3E8", minHeight: "44px" }}
          >
            {t("campaign_cta")}
          </Link>
        </div>
      </section>

      {/* ── FOOTER (gemeinsam mit allen Seiten, inkl. Newsletter) ── */}
      <Footer />
    </div>
  );
}
