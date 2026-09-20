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
      {/* Wortmarke in der Typografie der Marke: Archivo Black plus DM Serif
          kursiv in Gold, wie im Hero. Groesser als frueher (11-12 px), damit sie
          im Header als Logo wirkt. */}
      {/* Die drei Bereiche bekommen feste Grid-Spalten. Ohne das rutschte die
          rechte Gruppe auf dem Handy in die mittlere Spalte, sobald die
          Navigation (hidden md:flex) ausgeblendet war - Warenkorb und Menue
          hingen dann bei 75 % statt am rechten Rand. */}
      <Link
        href={`/${locale}`}
        className="text-[15px] md:text-[18px] whitespace-nowrap"
        style={{ color: "#1A3040", textDecoration: "none", lineHeight: 1, gridColumn: 1 }}
        aria-label="Verano Exótico — Startseite"
      >
        <span
          className="font-black tracking-[0.2em] uppercase"
          style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}
        >
          Verano
        </span>{" "}
        <span
          style={{
            fontFamily: "var(--font-dm-serif)",
            fontStyle: "italic",
            color: "#D4AF37",
            letterSpacing: "0.02em",
            fontSize: "1.15em",
          }}
        >
          Exótico
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8" aria-label="Hauptnavigation" style={{ gridColumn: 2 }}>
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

      <div className="flex items-center gap-3" style={{ gridColumn: 3, justifySelf: "end" }}>
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

        {/* Vorher nur drei Striche ohne Rahmen: rund 24x14 px Trefferflaeche,
            deutlich unter den empfohlenen 44 px. Jetzt 40 px wie der Warenkorb
            daneben, und die Striche klappen im offenen Zustand zum X. */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t("menu_close") : t("menu_open")}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          style={{
            position: "relative", width: "40px", height: "40px", flexShrink: 0,
            border: "1px solid rgba(26,48,64,0.15)", borderRadius: "50%",
            background: menuOpen ? "rgba(26,48,64,0.06)" : "transparent",
            color: "#1A3040", cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "4px",
          }}
        >
          <span
            className="block bg-current"
            style={{
              width: "16px", height: "1.5px", transition: "transform .25s ease",
              transform: menuOpen ? "translateY(2.75px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block bg-current"
            style={{
              width: "16px", height: "1.5px", transition: "transform .25s ease, opacity .2s ease",
              transform: menuOpen ? "translateY(-2.75px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-full left-0 right-0 flex flex-col px-6 pt-2 pb-6 md:hidden"
          style={{
            background: "#F8F3E8",
            borderTop: "1px solid rgba(26,48,64,0.1)",
            boxShadow: "0 12px 24px -12px rgba(26,48,64,0.25)",
          }}
        >
          {navLinks.map((link) => {
            // Aktuelle Seite markieren - vorher sahen alle Eintraege gleich aus.
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className="flex items-center justify-between text-base tracking-wide"
                style={{
                  color: "#1A3040",
                  fontFamily: "var(--font-syne)",
                  fontWeight: active ? 700 : 500,
                  textDecoration: "none",
                  minHeight: "52px", // bequeme Trefferflaeche statt 5px Zeilenabstand
                  borderBottom: "1px solid rgba(26,48,64,0.08)",
                }}
              >
                {link.label}
                {active && <span aria-hidden="true" style={{ color: "#D4AF37" }}>•</span>}
              </Link>
            );
          })}

          {/* Auf dem Handy gab es bisher keinen Shop-Knopf: der Header-Button
              ist hidden md:inline-flex und fehlte im Menue ersatzlos. */}
          <Link
            href={`/${locale}/collection`}
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center justify-center text-[11px] font-black tracking-[0.25em] uppercase mt-5"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              background: "#D4AF37",
              color: "#1A3040",
              minHeight: "48px",
              textDecoration: "none",
            }}
          >
            {t("cta")}
          </Link>

          <div className="mt-5 flex justify-center">
            <LanguageSwitch locale={locale} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
