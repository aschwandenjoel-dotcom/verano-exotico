import { LegalPage, Section, ulStyle } from "@/components/ui/LegalSections";
import type { Locale } from "@/types";

export const metadata = {
  title: "Rückgabe & Reklamation – Verano Exotico",
};

export default async function WiderrufPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LegalPage
      locale={locale as Locale}
      eyebrow="Rechtliches"
      title={<>Rückgabe &amp; Reklamation</>}
      stand="Stand: September 2026"
    >
      <Section title="Kein allgemeines Rückgaberecht">
        <p>
          Verano Exotico verkauft Bademode zu kleinen Grenzpreisen und produziert nicht
          auf Vorrat. Ein allgemeines Rückgaberecht „ohne Angabe von Gründen" bieten wir
          deshalb <strong>nicht</strong> an. Wir nehmen Artikel ausschliesslich bei{" "}
          <strong>Mängeln</strong> zurück oder tauschen sie um, insbesondere bei:
        </p>
        <ul style={ulStyle}>
          <li>Transportschäden (z. B. beschädigte oder verschmutzte Ware bei Ankunft)</li>
          <li>falsch gelieferten Produkten (nicht das bestellte Modell, Farbe oder Grösse)</li>
          <li>schlechter oder fehlerhafter Qualität (z. B. Nähte, Materialfehler)</li>
        </ul>
      </Section>

      <Section title="So funktioniert die Reklamation">
        <ul style={ulStyle}>
          <li>
            Melden Sie den Mangel innerhalb von <strong>14 Tagen nach Erhalt</strong> per
            E-Mail an{" "}
            <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a>{" "}
            — mit Bestellnummer und Fotos des Mangels.
          </li>
          <li>Wir prüfen die Meldung und melden uns mit den weiteren Schritten (Umtausch, Nachbesserung oder Rückerstattung).</li>
          <li>Ist eine Rücksendung nötig, erhalten Sie von uns die Rücksendeadresse; die Kosten dafür übernehmen wir bei einem bestätigten Mangel.</li>
          <li>Nach Eingang und Prüfung der Ware erstatten wir den Kaufpreis (oder den betroffenen Teil davon) auf das ursprünglich verwendete Zahlungsmittel (Karte bzw. TWINT).</li>
        </ul>
      </Section>

      <Section title="Wichtig bei Bademode (Hygiene)">
        <p>
          Aus Hygienegründen prüfen wir bei jeder Reklamation, ob die Ware{" "}
          <strong>ungetragen</strong> ist und der Hygieneschutz bzw. die Etiketten{" "}
          <strong>unversehrt</strong> sind — ausser der Mangel selbst betrifft genau
          diesen Zustand (z. B. Transportschaden). Bitte probieren Sie Bikinis und
          Badeanzüge über der eigenen Unterwäsche an.
        </p>
      </Section>

      <Section title="Gesetzliche Gewährleistung">
        <p>
          Unabhängig von dieser Regelung gilt die gesetzliche Gewährleistung für
          mangelhafte Ware gemäss dem am Wohnsitz der Kundin/des Kunden anwendbaren
          Recht. Kontaktieren Sie uns in jedem Fall zuerst per E-Mail, damit wir eine
          rasche Lösung finden können.
        </p>
      </Section>
    </LegalPage>
  );
}
