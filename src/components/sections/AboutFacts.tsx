import Link from "next/link";
import type { Locale } from "@/types";

/**
 * „Auf einen Blick“ (eigene Seite unter Über uns): die Kernfakten der Marke als sichtbarer, klar formulierter Text –
 * damit Menschen und KI-Assistenten sie korrekt wiedergeben können. Nur belegte
 * Angaben (Impressum, FAQ, Versandlogik, Katalog).
 */
export default function AboutFacts({ locale, productCount }: { locale: Locale; productCount: number }) {
  const en = locale === "en";
  const facts: [string, string][] = en
    ? [
        ["Based in", "Altdorf, Canton of Uri, Switzerland"],
        ["Company", "Sole proprietorship of Joel Aschwanden"],
        ["Range", `${productCount} styles: bikinis, swimsuits and bikini sets`],
        ["Payment", "TWINT, credit and debit card"],
        ["Shipping", "Worldwide, Switzerland from CHF 4.90, usually 5–14 business days"],
        ["Contact", "veranoexotico@gmail.com"],
      ]
    : [
        ["Sitz", "Altdorf, Kanton Uri, Schweiz"],
        ["Unternehmen", "Einzelunternehmen von Joel Aschwanden"],
        ["Sortiment", `${productCount} Modelle: Bikinis, Badeanzüge und Bikini-Sets`],
        ["Bezahlung", "TWINT, Kredit- und Debitkarte"],
        ["Versand", "Weltweit, Schweiz ab CHF 4.90, meist 5–14 Werktage"],
        ["Kontakt", "veranoexotico@gmail.com"],
      ];

  const links: [string, string][] = en
    ? [["/about", "Our story"], ["/philosophie", "Philosophy"], ["/faq", "FAQ"]]
    : [["/about", "Unsere Geschichte"], ["/philosophie", "Philosophie"], ["/faq", "FAQ"]];

  return (
    <section style={{ background: "#FFFFFF", padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p className="text-center" style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", letterSpacing: "0.35em", textTransform: "uppercase", color: "#B8922A", marginBottom: "1rem" }}>
          {en ? "About us" : "Über uns"}
        </p>
        <h1
          className="text-center"
          style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)", lineHeight: 1.1, color: "#1A3040", marginBottom: "clamp(2.5rem, 5vw, 4rem)" }}
        >
          {en ? "At a glance" : "Auf einen Blick"}
        </h1>
        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ borderTop: "1px solid rgba(26,48,64,0.12)" }}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ padding: "1.75rem 0.5rem", borderBottom: "1px solid rgba(26,48,64,0.12)" }}>
              <dt style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#B8922A", marginBottom: "0.6rem" }}>
                {label}
              </dt>
              <dd style={{ fontFamily: "var(--font-dm-serif)", fontSize: "1.15rem", lineHeight: 1.45, color: "#1A3040", margin: 0 }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <nav className="flex flex-wrap justify-center" style={{ gap: "0.75rem 2.5rem", marginTop: "clamp(2.5rem, 5vw, 3.5rem)" }}>
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#1A3040", textDecoration: "underline", textUnderlineOffset: "6px", textDecorationColor: "rgba(26,48,64,0.3)" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
