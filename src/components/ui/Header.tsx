"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/types";

interface Props {
  locale: Locale;
}

export default function Header({ locale }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: "Start" },
    { href: `/${locale}/collection`, label: "Shop" },
    { href: `/${locale}/about`, label: "Über uns" },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
      style={{ background: "#F8F3E8", borderBottom: "1px solid rgba(26,48,64,0.1)" }}
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

      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/collection`}
          className="hidden md:inline-flex items-center text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "var(--font-archivo-black), sans-serif",
            background: "#D4AF37",
            color: "#1A3040",
            minHeight: "44px",
          }}
        >
          Jetzt shoppen
        </Link>

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
