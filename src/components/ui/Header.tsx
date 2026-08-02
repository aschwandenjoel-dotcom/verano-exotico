"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types";
import { useCart } from "@/context/CartContext";

interface Props {
  locale: Locale;
}

const LOCALES: Locale[] = ["de", "en"];

/** Umschalter DE | EN — tauscht das Locale-Segment im aktuellen Pfad. */
function LanguageSwitch({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const pathname = usePathname() ?? `/${locale}`;

  const pathFor = (target: Locale) => {
    const parts = pathname.split("/");
    if (LOCALES.includes(parts[1] as Locale)) parts[1] = target;
    else parts.splice(1, 0, target);
    return parts.join("/") || `/${target}`;
  };

  return (
    <div
      aria-label="Sprache / Language"
      style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-geist-mono)", fontSize: "10px", letterSpacing: "0.15em" }}
    >
      {LOCALES.map((l, i) => (
        <span key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {i > 0 && <span aria-hidden="true" style={{ color: "rgba(26,48,64,0.25)" }}>/</span>}
          <Link
            href={pathFor(l)}
            onClick={onNavigate}
            aria-current={l === locale ? "true" : undefined}
            style={{
              color: l === locale ? "#1A3040" : "rgba(26,48,64,0.4)",
              fontWeight: l === locale ? 700 : 400,
              textDecoration: "none",
              textTransform: "uppercase",
              padding: "4px 2px",
            }}
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}

export default function Header({ locale }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openCart, totalCount } = useCart();
  const t = useTranslations("nav");
  const tc = useTranslations("cart");
  const pathname = usePathname() ?? "";

  // Auf der Kasse lenkt der Warenkorb nur vom Ausfuellen ab.
  const showCart = !pathname.split("/").includes("checkout");

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/collection`, label: t("collection") },
    { href: `/${locale}/about`, label: t("about") },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-4"
      style={{
        background: "#F8F3E8",
        borderBottom: "1px solid rgba(26,48,64,0.1)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
      }}
    >
      <Link
        href={`/${locale}`}
        className="text-[11px] font-black tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-archivo-black), sans-serif", color: "#1A3040" }}
        aria-label="Verano Exotico — Startseite"
      >
        VERANO EXOTICO
      </Link>

      <nav className="hidden md:flex items-center gap-8" aria-label="Hauptnavigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[10px] tracking-[0.25em] uppercase transition-colors"
            style={{ color: "rgba(26,48,64,0.5)", fontFamily: "var(--font-geist-mono)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.5)")}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3" style={{ justifySelf: "end" }}>
        <div className="hidden md:block">
          <LanguageSwitch locale={locale} />
        </div>
        <Link
          href={`/${locale}/collection`}
          className="hidden md:inline-flex items-center text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px" }}
        >
          {t("cta")}
        </Link>

        {/* Cart button */}
        {showCart && (
          <button
            onClick={openCart}
            aria-label={tc("title")}
            style={{ position: "relative", width: "40px", height: "40px", border: "1px solid rgba(26,48,64,0.15)", borderRadius: "50%", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A3040", flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalCount > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: "#D4AF37", color: "#1A3040", fontSize: "9px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {totalCount > 9 ? "9+" : totalCount}
              </span>
            )}
          </button>
        )}

        <button
          className="md:hidden"
          style={{ color: "#1A3040" }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="block w-6 h-0.5 bg-current mb-1.5" />
          <span className="block w-6 h-0.5 bg-current mb-1.5" />
          <span className="block w-4 h-0.5 bg-current" />
        </button>
      </div>

      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 flex flex-col px-6 py-6 gap-5 md:hidden"
          style={{ background: "#F8F3E8", borderTop: "1px solid rgba(26,48,64,0.1)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-base font-medium tracking-wide"
              style={{ color: "#1A3040", fontFamily: "var(--font-syne)" }}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitch locale={locale} onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
