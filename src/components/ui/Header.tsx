"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types";
import { useCart } from "@/context/CartContext";
import { DARK_BLUE } from "@/lib/theme";
import { CATEGORIES } from "@/lib/categories";

const CREAM = "#F8F3E8";

const HEADER_H = 72;

/** Für den anfangs durchsichtigen Header: neu prüfen bei Scrollen und Grössenänderung. */
const subscribeScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  window.addEventListener("resize", cb);
  return () => {
    window.removeEventListener("scroll", cb);
    window.removeEventListener("resize", cb);
  };
};

/**
 * Dunkelblau, sobald das Titelbild unter dem Header vorbei ist: Die Seite markiert
 * den ersten Inhalt nach dem Bild mit `data-header-solid-from`. Ohne Markierung
 * genügen 40 px Scrollen.
 */
const pastTitleImage = () => {
  const marker = document.querySelector("[data-header-solid-from]");
  return marker ? marker.getBoundingClientRect().top <= HEADER_H : window.scrollY > 40;
};

interface Props {
  locale: Locale;
  /** Über dem Titelbild durchsichtig, danach dunkelblau (Startseite, Shop). */
  transparentAtTop?: boolean;
}

const LOCALES: Locale[] = ["de", "en"];

/** Umschalter DE | EN — tauscht das Locale-Segment im aktuellen Pfad. */
function LanguageSwitch({ locale, onNavigate, onLight = false }: { locale: Locale; onNavigate?: () => void; onLight?: boolean }) {
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
          {i > 0 && <span aria-hidden="true" style={{ color: onLight ? "rgba(26,48,64,0.3)" : "rgba(248,243,232,0.3)" }}>/</span>}
          <Link
            href={pathFor(l)}
            onClick={onNavigate}
            aria-current={l === locale ? "true" : undefined}
            style={{
              color: onLight
                ? (l === locale ? "#1A3040" : "rgba(26,48,64,0.45)")
                : (l === locale ? CREAM : "rgba(248,243,232,0.55)"),
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

export default function Header({ locale, transparentAtTop = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  // stabil, sonst würde das Menü bei jedem Scroll-Render die Seitensperre neu setzen
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const scrolled = useSyncExternalStore(subscribeScroll, pastTitleImage, () => false);
  const solid = !transparentAtTop || scrolled || menuOpen;
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
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 h-[72px]"
      style={{
        // Durchsichtig: leichter Verlauf, damit Logo und Navigation auf hellen Bildstellen lesbar bleiben
        // no-repeat border-box: sonst wiederholt sich der Verlauf unter der 1-px-Kante und
        // zeichnet dort seine dunkelste Zeile als schwarze Linie
        background: solid ? DARK_BLUE : "linear-gradient(to bottom, rgba(5,25,35,0.45), rgba(5,25,35,0)) no-repeat border-box",
        borderBottom: `1px solid ${solid ? "rgba(248,243,232,0.08)" : "transparent"}`,
        transition: "background 0.3s ease, border-color 0.3s ease",
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
      {/* Handy: Menü links wie bei Hunza G (Logo Mitte, Warenkorb rechts) */}
      <button
        className="md:hidden row-start-1 col-start-1 justify-self-start"
        onClick={() => setMenuOpen(true)}
        aria-label={t("menu_open")}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        style={{
          width: "40px", height: "40px", marginLeft: "-8px", background: "transparent", border: "none",
          color: CREAM, cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "6px",
        }}
      >
        <span className="block bg-current" style={{ width: "20px", height: "1.2px" }} />
        <span className="block bg-current" style={{ width: "20px", height: "1.2px" }} />
      </button>

      <Link
        href={`/${locale}`}
        className="text-[15px] md:text-[18px] whitespace-nowrap row-start-1 col-start-2 justify-self-center md:col-start-1 md:justify-self-start"
        style={{ color: CREAM, textDecoration: "none", lineHeight: 1 }}
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

      <nav className="hidden md:flex items-center gap-8 row-start-1 col-start-2" aria-label="Hauptnavigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[10px] tracking-[0.25em] uppercase transition-colors"
            style={{ color: "rgba(248,243,232,0.7)", fontFamily: "var(--font-geist-mono)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,243,232,0.7)")}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 row-start-1 col-start-3 justify-self-end">
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
            style={{ position: "relative", width: "40px", height: "40px", border: "1px solid rgba(248,243,232,0.3)", borderRadius: "50%", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: CREAM, flexShrink: 0 }}
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

      </div>

      {menuOpen && <MobileMenu locale={locale} pathname={pathname} onClose={closeMenu} />}
    </header>
  );
}

/**
 * Handy-Menü wie bei Hunza G: Fläche gleitet von links herein, grosse Einträge
 * in Versalien, Unterpunkte klappen per Plus auf. Escape, Klick daneben oder
 * ein Link schliessen es; die Seite dahinter scrollt nicht mit.
 */
function MobileMenu({ locale, pathname, onClose }: { locale: Locale; pathname: string; onClose: () => void }) {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const groups: { id: string; label: string; links: { href: string; label: string }[] }[] = [
    {
      id: "shop",
      label: t("collection"),
      links: [
        { href: `/${locale}/collection`, label: t("shop_all") },
        ...CATEGORIES.map((c) => ({ href: `/${locale}/${c.slug}`, label: c[locale === "en" ? "en" : "de"].label })),
      ],
    },
    {
      id: "about",
      label: t("about"),
      links: [
        { href: `/${locale}/about`, label: tf("our_story") },
        { href: `/${locale}/philosophie`, label: tf("philosophy") },
        { href: `/${locale}/auf-einen-blick`, label: tf("at_a_glance") },
      ],
    },
    {
      id: "service",
      label: tf("col_service"),
      links: [
        { href: `/${locale}/versand`, label: tf("links_shipping") },
        { href: `/${locale}/widerruf`, label: tf("links_withdrawal") },
        { href: `/${locale}/faq`, label: tf("links_faq") },
      ],
    },
  ];

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
    padding: "20px 0", background: "transparent", border: "none", cursor: "pointer",
    color: "#1A3040", fontFamily: "var(--font-geist-mono)", fontSize: "13px",
    letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", textAlign: "left",
  };

  return (
    <div id="mobile-menu" className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <style>{`@keyframes menuIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(5,25,35,0.45)" }} />
      <nav
        aria-label="Menü"
        style={{
          position: "absolute", top: 0, bottom: 0, left: 0, width: "min(420px, 88vw)",
          background: "#F8F3E8", overflowY: "auto", padding: "0 24px 32px",
          animation: "menuIn 0.35s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px", borderBottom: "1px solid rgba(26,48,64,0.1)" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("menu_close")}
            style={{ width: 40, height: 40, marginLeft: -10, background: "transparent", border: "none", color: "#1A3040", fontSize: 26, lineHeight: 1, cursor: "pointer" }}
          >
            ×
          </button>
          <span className="text-[15px] whitespace-nowrap" style={{ color: "#1A3040", lineHeight: 1 }}>
            <span className="font-black tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}>Verano</span>{" "}
            <span style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "#B8922A", fontSize: "1.15em" }}>Exótico</span>
          </span>
          <span style={{ width: 30 }} />
        </div>

        <Link
          href={`/${locale}`}
          onClick={onClose}
          aria-current={pathname === `/${locale}` ? "page" : undefined}
          style={{ ...rowStyle, borderBottom: "1px solid rgba(26,48,64,0.1)" }}
        >
          {t("home")}
        </Link>

        {groups.map((g) => {
          const open = openGroup === g.id;
          return (
            <div key={g.id} style={{ borderBottom: "1px solid rgba(26,48,64,0.1)" }}>
              <button type="button" onClick={() => setOpenGroup(open ? null : g.id)} aria-expanded={open} style={rowStyle}>
                {g.label}
                <span aria-hidden="true" style={{ fontSize: "20px", fontWeight: 300, letterSpacing: 0 }}>{open ? "−" : "+"}</span>
              </button>
              {open && (
                <ul style={{ padding: "0 0 18px", margin: 0, listStyle: "none" }}>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={onClose}
                        aria-current={pathname === l.href ? "page" : undefined}
                        style={{ display: "block", padding: "10px 0", fontFamily: "var(--font-syne)", fontSize: "15px", color: pathname === l.href ? "#B8922A" : "#1A3040", textDecoration: "none" }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LanguageSwitch locale={locale} onNavigate={onClose} onLight />
          <a
            href="https://www.instagram.com/veranoexotico/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(26,48,64,0.2)", color: "#1A3040", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </nav>
    </div>
  );
}
