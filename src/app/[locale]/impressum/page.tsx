import type React from "react";
import ShopShell from "@/components/ui/ShopShell";
import type { Locale } from "@/types";

export const metadata = {
  title: "Impressum – Verano Exotico",
};

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ShopShell locale={locale as Locale}>
      <div style={{ background: "#F8F3E8", minHeight: "100vh", padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <LegalContent />
        </div>
      </div>
    </ShopShell>
  );
}

function LegalContent() {
  return (
    <div style={{ fontFamily: "var(--font-syne), sans-serif", color: "#1A3040", lineHeight: 1.8 }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", fontFamily: "var(--font-geist-mono)", marginBottom: "12px" }}>
        Rechtliches
      </p>
      <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", lineHeight: 1, marginBottom: "48px" }}>
        Impressum
      </h1>

      <Section title="Anbieter">
        <p>Verano Exotico<br />
        Inhaber: Joel Aschwanden<br />
        Gotthardstrasse 59<br />
        6460 Altdorf<br />
        Schweiz</p>
      </Section>

      <Section title="Kontakt">
        <p>
          E-Mail: <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a><br />
          Telefon: <a href="tel:+41793896659" style={{ color: "#1A3040" }}>+41 79 389 66 59</a>
        </p>
      </Section>

      <Section title="Unternehmensform">
        <p>Einzelunternehmen, nicht im Handelsregister eingetragen.<br />
        UID: nicht vorhanden.</p>
      </Section>

      <Section title="Plattform & Hosting">
        <p>Diese Website wurde mit Next.js entwickelt und wird über Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA, gehostet.</p>
      </Section>

      <Section title="Haftungsausschluss">
        <h3 style={h3}>Haftung für Inhalte</h3>
        <p>Die Inhalte dieser Website wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernimmt der Anbieter jedoch keine Gewähr. Als Einzelunternehmen sind wir gemäss den allgemeinen Gesetzen nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>

        <h3 style={h3}>Haftung für Links</h3>
        <p>Diese Website enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstösse überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend entfernt.</p>
      </Section>

      <Section title="Urheberrecht">
        <p>Die durch den Anbieter erstellten Inhalte und Werke auf dieser Website unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
      </Section>

      <Section title="Streitbeilegung">
        <p>Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Bei Anliegen zu Ihrer Bestellung wenden Sie sich bitte direkt an uns — wir finden eine Lösung.</p>
      </Section>
    </div>
  );
}

const h3: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black), sans-serif",
  fontWeight: 900,
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#1A3040",
  marginTop: "24px",
  marginBottom: "8px",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
