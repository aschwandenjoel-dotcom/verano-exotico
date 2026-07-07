import type React from "react";
import ShopShell from "@/components/ui/ShopShell";
import type { Locale } from "@/types";

/** Gemeinsames Layout für Rechts- und Infoseiten (Impressum-Stil). */
export function LegalPage({
  locale,
  eyebrow,
  title,
  stand,
  children,
}: {
  locale: Locale;
  eyebrow: string;
  title: React.ReactNode;
  stand?: string;
  children: React.ReactNode;
}) {
  return (
    <ShopShell locale={locale}>
      <div style={{ background: "#F8F3E8", minHeight: "100vh", padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", color: "#1A3040", lineHeight: 1.8 }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", fontFamily: "var(--font-geist-mono)", marginBottom: "12px" }}>
              {eyebrow}
            </p>
            <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", lineHeight: 1, marginBottom: stand ? "16px" : "48px" }}>
              {title}
            </h1>
            {stand && (
              <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.5)", fontFamily: "var(--font-geist-mono)", marginBottom: "48px" }}>
                {stand}
              </p>
            )}
            {locale === "en" && (
              <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.55)", fontStyle: "italic", marginBottom: "40px" }}>
                Our legal and service pages are provided in German. For questions in English, contact us at{" "}
                <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a>.
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </ShopShell>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "40px", paddingBottom: "40px", borderBottom: "1px solid rgba(26,48,64,0.1)" }}>
      <h2 style={{
        fontFamily: "var(--font-archivo-black), sans-serif",
        fontWeight: 900,
        fontSize: "clamp(1rem, 2vw, 1.25rem)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#1A3040",
        marginBottom: "16px",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: "15px", color: "rgba(26,48,64,0.75)", lineHeight: 1.85 }}>
        {children}
      </div>
    </div>
  );
}

export const h3Style: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black), sans-serif",
  fontWeight: 900,
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#1A3040",
  marginTop: "24px",
  marginBottom: "8px",
};

export const ulStyle: React.CSSProperties = {
  paddingLeft: "20px",
  margin: "12px 0",
};
