"use client";

import type React from "react";
import { useTranslations, useLocale } from "next-intl";

const INSTAGRAM_URL = "https://www.instagram.com/veranoexotico/";

const linkStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "var(--font-geist-mono)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(26,48,64,0.55)",
  textDecoration: "none",
  transition: "color 0.15s",
};

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  const links = [
    { href: `/${locale}/versand`, label: t("links_shipping") },
    { href: `/${locale}/faq`, label: t("links_faq") },
    { href: `/${locale}/agb`, label: t("links_terms") },
    { href: `/${locale}/widerruf`, label: t("links_withdrawal") },
    { href: `/${locale}/impressum`, label: t("links_legal") },
    { href: `/${locale}/datenschutz`, label: t("links_privacy") },
  ];

  return (
    <footer style={{ background: "#F8F3E8", borderTop: "1px solid rgba(26,48,64,0.08)" }}>
      <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "48px clamp(1.5rem, 5vw, 2.5rem) 40px" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* Top row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "13px", fontFamily: "var(--font-archivo-black), sans-serif", fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#1A3040" }}>
                Verano Exotico
              </p>
              <p style={{ marginTop: "6px", fontSize: "12px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.45)", fontStyle: "italic" }}>
                {t("tagline")}
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ ...linkStyle, display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "14px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.55)")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                @veranoexotico
              </a>
            </div>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", rowGap: "12px" }}>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={linkStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.55)")}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(26,48,64,0.08)" }} />

          {/* Bottom row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.4)" }}>
              © {new Date().getFullYear()} Verano Exotico. Alle Rechte vorbehalten.
            </p>
            <p style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.4)" }}>
              {t("payment_note")}
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
