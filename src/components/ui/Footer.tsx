"use client";

import type React from "react";
import { useTranslations, useLocale } from "next-intl";

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
