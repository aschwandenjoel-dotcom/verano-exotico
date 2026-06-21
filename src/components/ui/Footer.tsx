"use client";

import { useTranslations, useLocale } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

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

            <div style={{ display: "flex", gap: "32px" }}>
              <a
                href={`/${locale}/impressum`}
                style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(26,48,64,0.55)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.55)")}
              >
                {t("links_legal")}
              </a>
              <a
                href={`/${locale}/datenschutz`}
                style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(26,48,64,0.55)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.55)")}
              >
                {t("links_privacy")}
              </a>
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
              Curated worldwide. Shipped to you.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
