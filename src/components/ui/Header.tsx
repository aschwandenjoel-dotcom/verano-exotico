"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/types";
import { useCart } from "@/context/CartContext";

interface Props {
  locale: Locale;
}

export default function Header({ locale }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openCart, totalCount } = useCart();

  const navLinks = [
    { href: `/${locale}`, label: "Start" },
    { href: `/${locale}/collection`, label: "Shop" },
    { href: `/${locale}/about`, label: "Über uns" },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 md:px-10 py-4"
      style={{ background: "#F8F3E8", borderBottom: "1px solid rgba(26,48,64,0.1)", position: "fixed" }}
    >
      <Link
        href={`/${locale}`}
        className="text-[11px] font-black tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-archivo-black), sans-serif", color: "#1A3040" }}
        aria-label="Verano Exotico — Startseite"
      >
        VERANO EXOTICO
      </Link>

      <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2" aria-label="Hauptnavigation">
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

      <div className="ml-auto flex items-center gap-3">
        <Link
          href={`/${locale}/collection`}
          className="hidden md:inline-flex items-center text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px" }}
        >
          Jetzt shoppen
        </Link>

        {/* Cart button */}
        <button
          onClick={openCart}
          aria-label="Warenkorb öffnen"
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
        </div>
      )}
    </header>
  );
}
