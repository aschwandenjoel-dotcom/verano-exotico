"use client";

import type React from "react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORIES } from "@/lib/categories";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/newsletterOffer";
import { DARK_BLUE } from "@/lib/theme";
import NewsletterInput from "./NewsletterInput";

const INSTAGRAM_URL = "https://www.instagram.com/veranoexotico/";

const CREAM = "#F8F3E8";

const headingStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "var(--font-geist-mono)",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: CREAM,
  marginBottom: "18px",
};

const linkStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(248,243,232,0.65)",
  textDecoration: "none",
  transition: "color 0.15s",
  lineHeight: 1.4,
};

/**
 * Footer im Stil von Hunza G: Marke mit Social-Icon und Leitsatz, daneben
 * Linkspalten mit Überschrift, darunter "Bleib in Verbindung" mit Newsletter,
 * ganz unten eine schlichte Copyright-Zeile. Auf Dunkelblau wie der Header.
 */
export default function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("newsletter");
  const locale = useLocale();
  // Handy: Link-Gruppen zum Aufklappen wie bei Hunza G
  const [openCol, setOpenCol] = useState<string | null>(null);

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t("col_shop"),
      links: CATEGORIES.map((c) => ({ href: `/${locale}/${c.slug}`, label: c[locale === "en" ? "en" : "de"].label })),
    },
    {
      title: t("col_service"),
      links: [
        { href: `/${locale}/versand`, label: t("links_shipping") },
        { href: `/${locale}/widerruf`, label: t("links_withdrawal") },
        { href: `/${locale}/faq`, label: t("links_faq") },
      ],
    },
    {
      title: t("col_about"),
      links: [
        { href: `/${locale}/about`, label: t("our_story") },
        { href: `/${locale}/philosophie`, label: t("philosophy") },
        { href: `/${locale}/auf-einen-blick`, label: t("at_a_glance") },
      ],
    },
    {
      title: t("col_legal"),
      links: [
        { href: `/${locale}/agb`, label: t("links_terms") },
        { href: `/${locale}/impressum`, label: t("links_legal") },
        { href: `/${locale}/datenschutz`, label: t("links_privacy") },
      ],
    },
  ];

  return (
    <footer style={{ background: DARK_BLUE, color: CREAM }}>
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "64px clamp(1.5rem, 5vw, 2.5rem) 32px" }}>

        {/* Marke + Linkspalten */}
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_repeat(4,1fr)] gap-x-8 gap-y-10">
          <div className="col-span-2 md:col-span-1">
            <p className="text-[18px] whitespace-nowrap" style={{ lineHeight: 1 }}>
              <span className="font-black tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-archivo-black), sans-serif" }}>
                Verano
              </span>{" "}
              <span style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "#D4AF37", fontSize: "1.15em" }}>
                Exótico
              </span>
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center justify-center mt-6"
              style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(248,243,232,0.3)", color: CREAM }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <p className="mt-6 max-w-[260px]" style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(248,243,232,0.65)" }}>
              {t("tagline")}
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="hidden md:block">
              <p style={headingStyle}>{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      style={linkStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,243,232,0.65)")}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Handy: Gruppen als Klappzeilen */}
        <div className="md:hidden mt-10" style={{ borderTop: "1px solid rgba(248,243,232,0.15)" }}>
          {columns.map((col) => {
            const open = openCol === col.title;
            return (
              <div key={col.title} style={{ borderBottom: "1px solid rgba(248,243,232,0.15)" }}>
                <button
                  type="button"
                  onClick={() => setOpenCol(open ? null : col.title)}
                  aria-expanded={open}
                  style={{ ...headingStyle, marginBottom: 0, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  {col.title}
                  <span aria-hidden="true" style={{ fontSize: "18px", fontWeight: 300, letterSpacing: 0 }}>{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <ul className="space-y-3" style={{ padding: "0 0 18px", margin: 0, listStyle: "none" }}>
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} style={linkStyle}>{link.label}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Bleib in Verbindung */}
        <div
          className="mt-14 pt-10 grid gap-6 md:grid-cols-2 md:items-end"
          style={{ borderTop: "1px solid rgba(248,243,232,0.15)" }}
        >
          <div>
            <p style={{ ...headingStyle, marginBottom: "10px" }}>{t("newsletter_title")}</p>
            <p className="max-w-md" style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(248,243,232,0.65)" }}>
              {t("newsletter_text")}
              {WELCOME_DISCOUNT_PERCENT > 0 && <> {tn("offer", { percent: WELCOME_DISCOUNT_PERCENT })}</>}
            </p>
          </div>
          <div className="md:justify-self-end w-full md:max-w-md">
            <NewsletterInput />
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-12 pt-6 flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(248,243,232,0.15)", fontSize: "11px", fontFamily: "var(--font-geist-mono)", color: "rgba(248,243,232,0.45)" }}
        >
          <p>© {new Date().getFullYear()} – Verano Exotico</p>
          <p>{t("payment_note")}</p>
        </div>
      </div>
    </footer>
  );
}
