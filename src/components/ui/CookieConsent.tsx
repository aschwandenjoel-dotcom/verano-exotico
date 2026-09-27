"use client";

import { useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { getConsent, getServerConsent, setConsent, subscribe } from "@/lib/consent";

/**
 * Hinweis auf die Reichweitenmessung mit Auswahl.
 *
 * Vercel Web Analytics arbeitet ohne Cookies und ohne geräteübergreifende
 * Kennungen; rechtlich wäre eine Einwilligung daher nicht zwingend. Der Hinweis
 * ist eine bewusste Entscheidung für Transparenz.
 *
 * Wenn eine Wahl angeboten wird, muss sie auch wirken: Die Messung wird erst
 * nach "Einverstanden" geladen. Bei "Nur notwendige" wird sie gar nicht erst
 * eingebunden. Die Entscheidung liegt in localStorage (kein Cookie) und gilt
 * für dieses Gerät; über den Link in der Datenschutzerklärung lässt sie sich
 * widerrufen.
 *
 * useSyncExternalStore statt useState+useEffect: Serverseitig ist die
 * Entscheidung "unknown", dann wird nichts gerendert — kein Aufblitzen des
 * Banners bei Besucherinnen, die längst zugestimmt haben.
 *
 * Das Banner blockiert die Seite nicht — der Shop bleibt vollständig nutzbar,
 * auch ohne Entscheidung.
 */
export default function CookieConsent() {
  const t = useTranslations("consent");
  const locale = useLocale();
  const choice = useSyncExternalStore(subscribe, getConsent, getServerConsent);

  return (
    <>
      {choice === "yes" && <Analytics />}

      {choice === "none" && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t("aria")}
          style={{
            position: "fixed",
            left: "max(16px, env(safe-area-inset-left))",
            right: "max(16px, env(safe-area-inset-right))",
            bottom: "max(16px, env(safe-area-inset-bottom))",
            zIndex: 60,
            maxWidth: "560px",
            marginLeft: "auto",
            background: "#F8F3E8",
            color: "#1A3040",
            border: "1px solid rgba(26,48,64,0.12)",
            borderRadius: "14px",
            boxShadow: "0 18px 40px -18px rgba(26,48,64,0.45)",
            padding: "20px 22px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#D4AF37",
              fontFamily: "var(--font-geist-mono)",
              margin: "0 0 10px",
            }}
          >
            {t("eyebrow")}
          </p>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.65,
              fontFamily: "var(--font-syne)",
              color: "rgba(26,48,64,0.8)",
              margin: 0,
            }}
          >
            {t("text")}{" "}
            <a
              href={`/${locale}/datenschutz`}
              style={{ color: "#1A3040", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              {t("link")}
            </a>
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => setConsent("yes")}
              className="hover:opacity-85 transition-opacity"
              style={{
                flex: "1 1 160px",
                minHeight: "44px",
                padding: "0 20px",
                background: "#D4AF37",
                color: "#1A3040",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-archivo-black), sans-serif",
                fontWeight: 900,
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              {t("accept")}
            </button>
            <button
              type="button"
              onClick={() => setConsent("no")}
              className="hover:opacity-85 transition-opacity"
              style={{
                flex: "1 1 160px",
                minHeight: "44px",
                padding: "0 20px",
                background: "transparent",
                color: "rgba(26,48,64,0.75)",
                border: "1px solid rgba(26,48,64,0.22)",
                cursor: "pointer",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              {t("decline")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
