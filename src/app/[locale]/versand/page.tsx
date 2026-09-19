import { LegalPage, Section, ulStyle } from "@/components/ui/LegalSections";
import { shippingTable } from "@/lib/shipping";
import type { Locale } from "@/types";

export const metadata = {
  title: "Versand & Rückgabe – Verano Exotico",
};

export default async function VersandPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LegalPage
      locale={locale as Locale}
      eyebrow="Service"
      title={<>Versand &amp; Rückgabe</>}
    >
      <Section title="Versandkosten">
        <p>
          Die Versandkosten werden <strong>individuell berechnet</strong>: Sie hängen von
          der Distanz (Zielland) und der Anzahl der Artikel ab und werden im Checkout vor
          der Bestellung transparent ausgewiesen und auf den Warenwert aufgeschlagen.
        </p>
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                {["Zielland", "Grundpreis", "je weiterer Artikel", "Maximal"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #1A3040", fontFamily: "var(--font-geist-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A3040" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shippingTable().map((row) => (
                <tr key={row.countries}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(26,48,64,0.1)" }}>{row.countries}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(26,48,64,0.1)" }}>CHF {row.base.toFixed(2)}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(26,48,64,0.1)" }}>+ CHF {row.perItem.toFixed(2)}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(26,48,64,0.1)" }}>CHF {row.cap.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: "12px", fontSize: "13px" }}>
          Beispiel: 3 Artikel in die Schweiz = CHF 4.90 + 2 × CHF 1.00 = <strong>CHF 6.90</strong>.
        </p>
      </Section>

      <Section title="Zahlung">
        <p>
          Du bezahlst <strong>per Kreditkarte, Debitkarte oder TWINT</strong> — sicher
          über Stripe, ohne Zusatzgebühren. Deine Kartendaten werden ausschliesslich auf
          der gesicherten Bezahlseite erfasst und gelangen nicht zu uns. Sobald die
          Zahlung bestätigt ist, erhältst du die Bestellbestätigung per E-Mail und die
          Bestellung wird versandbereit gemacht.
        </p>
      </Section>

      <Section title="Lieferzeit">
        <p>
          Die Lieferzeit beträgt in der Regel <strong>5–14 Werktage ab
          Zahlungseingang</strong>. Deine Bestellung wird aus internationalen Lagern
          unseres Logistikpartners versandt — so können wir faire Preise und eine grosse
          Auswahl anbieten.
        </p>
        <ul style={ulStyle}>
          <li>Bestellbestätigung mit Zahlungsanweisungen per E-Mail direkt nach der Bestellung.</li>
          <li>Versandbestätigung mit Sendungsnummer, sobald das Paket unterwegs ist.</li>
          <li>Die Sendungsnummer kann je nach Zielland einige Stunden brauchen, bis sie im Tracking-System erscheint.</li>
        </ul>
      </Section>

      <Section title="Zoll & Einfuhrabgaben">
        <p>
          Innerhalb der Schweiz, Liechtensteins und Europas werden Sendungen in der Regel
          ohne zusätzliche Abgaben zugestellt. Bei Lieferungen in andere Länder können je
          nach lokalem Recht Einfuhrabgaben, Zoll oder Steuern anfallen — diese gehen zu
          Lasten der Empfängerin bzw. des Empfängers.
        </p>
      </Section>

      <Section title="Rückgabe & Reklamation">
        <p>
          Ein allgemeines Rückgaberecht bieten wir nicht an. Bei{" "}
          <strong>Mängeln</strong> — z. B. Transportschäden, falscher Lieferung oder
          mangelhafter Qualität — nehmen wir Artikel zurück oder tauschen sie um. So
          geht&apos;s:
        </p>
        <ul style={ulStyle}>
          <li>
            Melde den Mangel innerhalb von <strong>14 Tagen nach Erhalt</strong> per
            E-Mail an{" "}
            <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a>{" "}
            mit Bestellnummer und Fotos.
          </li>
          <li>Du erhältst die Rücksendeadresse und alle weiteren Schritte von uns.</li>
          <li>Nach Eingang und Prüfung der Ware erstatten wir den Kaufpreis auf dein ursprüngliches Zahlungsmittel.</li>
        </ul>
        <p style={{ marginTop: "12px" }}>
          <strong>Wichtig bei Bademode:</strong> Aus Hygienegründen prüfen wir bei jeder
          Reklamation, ob der Artikel ungetragen ist und Hygieneschutz bzw. Etikett
          unversehrt sind — ausser der Mangel betrifft genau diesen Zustand. Bitte
          probiere Bikinis und Badeanzüge über der eigenen Unterwäsche an. Alle Details
          findest du auf der Seite «Rückgabe &amp; Reklamation».
        </p>
      </Section>

      <Section title="Fragen?">
        <p>
          Wir helfen gerne:{" "}
          <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a>{" "}
          · Telefon <a href="tel:+41793896659" style={{ color: "#1A3040" }}>+41 79 389 66 59</a>
        </p>
      </Section>
    </LegalPage>
  );
}
