import type React from "react";
import ShopShell from "@/components/ui/ShopShell";
import type { Locale } from "@/types";

export const metadata = {
  title: "Datenschutzerklärung – Verano Exotico",
};

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ShopShell locale={locale as Locale}>
      <div style={{ background: "#F8F3E8", minHeight: "100vh", padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <PrivacyContent />
        </div>
      </div>
    </ShopShell>
  );
}

function PrivacyContent() {
  return (
    <div style={{ fontFamily: "var(--font-syne), sans-serif", color: "#1A3040", lineHeight: 1.8 }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", fontFamily: "var(--font-geist-mono)", marginBottom: "12px" }}>
        Rechtliches
      </p>
      <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", lineHeight: 1, marginBottom: "16px" }}>
        Datenschutz&shy;erklärung
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.5)", fontFamily: "var(--font-geist-mono)", marginBottom: "48px" }}>
        Stand: Juli 2026
      </p>

      <Section title="1. Allgemeines">
        <p>Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Diese Datenschutzerklärung informiert Sie darüber, welche personenbezogenen Daten wir erheben, wie wir diese verwenden und welche Rechte Sie haben.</p>
        <p style={{ marginTop: "12px" }}>Verantwortlicher im Sinne des Schweizerischen Datenschutzgesetzes (DSG) sowie der Europäischen Datenschutz-Grundverordnung (DSGVO) für Kunden aus der EU/dem EWR:</p>
        <p style={{ marginTop: "12px" }}>
          <strong>Verano Exotico</strong><br />
          Inhaber: Joel Aschwanden<br />
          Gotthardstrasse 59, 6460 Altdorf, Schweiz<br />
          E-Mail: <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a><br />
          Telefon: +41 79 389 66 59
        </p>
      </Section>

      <Section title="2. Datenerfassung auf dieser Website">
        <h3 style={h3}>Technisch notwendige Daten (Server-Logs)</h3>
        <p>Beim Besuch unserer Website übermittelt Ihr Browser automatisch technische Informationen an unseren Hosting-Anbieter (Vercel). Diese sogenannten Server-Logfiles enthalten:</p>
        <ul style={ul}>
          <li>IP-Adresse (anonymisiert)</li>
          <li>Datum und Uhrzeit des Zugriffs</li>
          <li>Aufgerufene URL</li>
          <li>Verwendeter Browser und Betriebssystem</li>
          <li>HTTP-Statuscode</li>
        </ul>
        <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb der Website). Diese Daten werden nicht mit anderen Datenquellen zusammengeführt und nach spätestens 30 Tagen automatisch gelöscht.</p>

        <h3 style={h3}>Warenkorb (LocalStorage)</h3>
        <p>Der Inhalt Ihres Warenkorbs wird ausschliesslich lokal in Ihrem Browser gespeichert (localStorage). Diese Daten verlassen Ihr Gerät nicht und werden von uns nicht verarbeitet, bis Sie eine Bestellung aufgeben.</p>

        <h3 style={h3}>Cookies</h3>
        <p>Unsere Website verwendet ausschliesslich technisch notwendige Cookies, die für den Betrieb des Shops erforderlich sind. Es werden keine Tracking-, Werbe- oder Analyse-Cookies eingesetzt. Eine Einwilligung ist nach Art. 6 Abs. 1 lit. f DSGVO nicht erforderlich.</p>
      </Section>

      <Section title="3. Bestellprozess & Kundendaten">
        <p>Wenn Sie eine Bestellung aufgeben, erheben wir folgende Daten, die zur Vertragserfüllung erforderlich sind (Art. 6 Abs. 1 lit. b DSGVO):</p>
        <ul style={ul}>
          <li>Vor- und Nachname</li>
          <li>Lieferadresse</li>
          <li>E-Mail-Adresse</li>
          <li>Bestelldetails (Artikel, Menge, Preis)</li>
        </ul>
        <p>Die Zahlung erfolgt per Banküberweisung (Vorkasse). Kreditkartendaten werden von uns nicht erhoben und nicht verarbeitet.</p>
        <p style={{ marginTop: "12px" }}>Bestelldaten werden für die Dauer der gesetzlichen Aufbewahrungspflicht (10 Jahre gemäss OR Art. 958f) gespeichert und danach gelöscht.</p>
      </Section>

      <Section title="4. Zahlungsabwicklung (Banküberweisung)">
        <p>Die Bezahlung erfolgt per Überweisung auf unser Bankkonto (Vorkasse). Dabei erhalten wir von Ihrer Bank die üblichen Buchungsangaben (Name, IBAN, Betrag, Zahlungsreferenz). Diese Daten verwenden wir ausschliesslich zur Zuordnung und Abwicklung Ihrer Bestellung (Art. 6 Abs. 1 lit. b DSGVO) und bewahren sie im Rahmen der gesetzlichen Aufbewahrungspflichten auf. Eine Weitergabe an Dritte findet nicht statt.</p>
      </Section>

      <Section title="5. E-Mail-Versand (Bestellbestätigung)">
        <p>Zur Versendung von Bestellbestätigungen nutzen wir das Gmail-Postfach veranoexotico@gmail.com, betrieben von Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Ihre E-Mail-Adresse wird ausschliesslich für den transaktionalen Versand der Bestellbestätigung und der Versandbenachrichtigung verwendet und nicht für Werbezwecke genutzt.</p>
        <p style={{ marginTop: "12px" }}>Die Verarbeitung durch Google erfolgt auf Basis der Google-Workspace-/Gmail-Datenschutzbestimmungen; für Übermittlungen in die USA gelten die Standardvertragsklauseln (SCCs) der EU-Kommission.</p>
      </Section>

      <Section title="6. Hosting (Vercel)">
        <p>Diese Website wird bei Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA, gehostet. Vercel verarbeitet technische Zugriffsdaten als Auftragsverarbeiter gemäss Art. 28 DSGVO. Mit Vercel besteht ein Datenverarbeitungsvertrag. Die Datenübertragung in die USA erfolgt auf Basis der Standardvertragsklauseln (SCCs) der EU-Kommission.</p>
        <p style={{ marginTop: "12px" }}>Weitere Informationen: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#1A3040" }}>vercel.com/legal/privacy-policy</a></p>
      </Section>

      <Section title="7. Datenbank (Hostpoint)">
        <p>Zur Speicherung von Bestelldaten nutzen wir eine Datenbank bei Hostpoint AG, Neue Jonastrasse 60, 8640 Rapperswil-Jona, Schweiz. Bestelldaten werden verschlüsselt übertragen und gespeichert. Mit Hostpoint besteht ein Auftragsverarbeitungsvertrag; die Datenverarbeitung erfolgt in der Schweiz.</p>
      </Section>

      <Section title="8. Logistik & Auftragsabwicklung (CJ Dropshipping)">
        <p>Zur Auslieferung Ihrer Bestellung arbeiten wir mit dem Logistikdienstleister CJ Dropshipping (Yiwu Cute Jewelry Co., Ltd. bzw. CJ-Konzerngesellschaften mit Sitz in China und internationalen Lagerstandorten) zusammen. Zum Zweck der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) übermitteln wir folgende Daten an CJ Dropshipping:</p>
        <ul style={ul}>
          <li>Name der Empfängerin / des Empfängers</li>
          <li>Lieferadresse</li>
          <li>Telefonnummer (für Zustellung und Zollabwicklung)</li>
          <li>Bestellte Artikel und Mengen</li>
        </ul>
        <p>Die Übermittlung erfolgt in Länder ausserhalb der Schweiz und des EWR, insbesondere nach China. Für diese Länder besteht kein Angemessenheitsbeschluss; die Übermittlung ist jedoch zur Erfüllung des Vertrags mit Ihnen erforderlich (Art. 49 Abs. 1 lit. b DSGVO, Art. 17 Abs. 1 lit. a nDSG). Es werden nur die für den Versand zwingend notwendigen Daten übermittelt; Zahlungsdaten werden nicht weitergegeben.</p>
      </Section>

      <Section title="9. Newsletter & Produktbewertungen">
        <p><strong>Newsletter:</strong> Wenn Sie sich für unseren Newsletter anmelden, speichern wir Ihre E-Mail-Adresse in unserer Datenbank (Hostpoint), bis Sie sich abmelden. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO); Sie können diese jederzeit per E-Mail an uns widerrufen.</p>
        <p style={{ marginTop: "12px" }}><strong>Produktbewertungen:</strong> Wenn Sie eine Bewertung hinterlassen, speichern wir den von Ihnen angegebenen Namen (freiwillig, auch Pseudonym möglich), die Bewertung und den Kommentartext. Die Bewertung wird öffentlich auf der jeweiligen Produktseite angezeigt. Sie können die Löschung jederzeit per E-Mail verlangen.</p>
      </Section>

      <Section title="10. Analyse & Tracking">
        <p>Wir setzen <strong>keinerlei</strong> Web-Analyse-Tools (wie Google Analytics, Matomo o. ä.) und <strong>keine</strong> Werbe-Tracking-Pixel (wie Meta Pixel, TikTok Pixel o. ä.) ein. Es erfolgt keine Erstellung von Nutzerprofilen und keine Weitergabe Ihrer Daten an Werbenetzwerke.</p>
      </Section>

      <Section title="11. Ihre Rechte als betroffene Person">
        <p>Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
        <ul style={ul}>
          <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO / Art. 25 nDSG): Sie können jederzeit Auskunft über die von uns gespeicherten Daten verlangen.</li>
          <li><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO): Sie haben das Recht, unrichtige Daten berichtigen zu lassen.</li>
          <li><strong>Löschungsrecht</strong> (Art. 17 DSGVO): Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</li>
          <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO): Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen.</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Sie haben das Recht, Ihre Daten in einem maschinenlesbaren Format zu erhalten.</li>
          <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO): Sie können der Verarbeitung Ihrer Daten auf Basis berechtigter Interessen widersprechen.</li>
        </ul>
        <p style={{ marginTop: "12px" }}>Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a></p>
        <p style={{ marginTop: "12px" }}>Sie haben zudem das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. In der Schweiz ist dies der <strong>Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB)</strong>, in der EU die zuständige nationale Aufsichtsbehörde.</p>
      </Section>

      <Section title="12. Änderungen dieser Datenschutzerklärung">
        <p>Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen der rechtlichen Rahmenbedingungen oder unserer Dienstleistungen anzupassen. Die jeweils aktuelle Version ist auf dieser Seite abrufbar. Stand der aktuellen Fassung: Juli 2026.</p>
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

const ul: React.CSSProperties = {
  paddingLeft: "20px",
  marginTop: "8px",
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
