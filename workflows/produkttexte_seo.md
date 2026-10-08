# Produktnamen und -texte für Google schreiben

**Ziel:** Jedes Produkt hat einen sachlichen Namen und eine gegliederte
Beschreibung, wie sie grosse Shops nutzen (Zalando, C&A, Calzedonia). So wird
der Shop bei Suchen wie „Push-up-Bikini Leopard" oder „Badeanzug Cut-out"
gefunden, und das Produkt landet automatisch auf der richtigen Kategorieseite.

**Wann:** Bei jedem neuen Produkt, und wenn Namen oder Texte nicht mehr zu den
Bildern passen. Ersteinrichtung aller 57 Produkte am 08.10.2026.

---

## Eingaben

| Was | Woher |
|---|---|
| Aktuelle Produktdaten | `https://verano-exotico.ch/api/products` (nur aktive Produkte; enthält **keine** Farbbilder) |
| Produktbilder | `public/products/<slug>-*.jpg` — Farbvarianten liegen unter dem Slug des Grundmodells (z. B. `totem-triangle-bikini-c2-fit.jpg`). Die Bildadressen einer Produktseite stehen im JSON-LD der Live-Seite (`"image": [...]`). |
| `ADMIN_PASSWORD` | `.env.local` — muss mit dem Wert in Vercel übereinstimmen |

## Namen

Muster: **`<Typ> <Merkmal oder Muster>`**, höchstens etwa 35 Zeichen, keine
Fantasie- oder Spanischnamen, Schweizer Schreibweise (ss statt ß).

| Typwort (de) | en | Kategorieseite |
|---|---|---|
| Triangel-Bikini | Triangle Bikini | /triangel-bikinis |
| Push-up-Bikini | Push-up Bikini | /push-up-bikinis |
| Neckholder-Bikini | Halter Bikini | /neckholder-bikinis |
| Badeanzug (auch „Cut-out-Badeanzug …") | Swimsuit | /badeanzuege |
| Bikini-Set … (mit Rock, Kleid, Shirt) | Bikini Set … | /bikini-sets |
| Bandeau-, Bralette-, String-, Tanga-, Häkel-, One-Shoulder-Bikini | entsprechend | nur /bikinis |

- **Die Kategorien hängen am Typwort im deutschen Namen** (`src/lib/categories.ts`,
  Regex auf `name_de`). Wer „Push-up" im Namen weglässt, fehlt auf der
  Push-up-Seite. Alles mit „Bikini" im Namen erscheint unter /bikinis.
- Typ nur nennen, wenn er auf den Bildern stimmt: „Neckholder" nur bei Bindung
  hinter dem Nacken, „Tanga/String" nur bei knapper Rückseite, „High-Waist" nur
  bei Bund **über** dem Bauchnabel, „Push-up" nur bei sichtbar geformten Cups
  oder klarer Angabe in den CJ-Daten.
- Farbvarianten derselben Form: gleiches Typwort, Unterschied über Muster/Farbe
  („Push-up-Bikini Leopard", „Push-up-Bikini Türkis Blüten").
- Jeder Name muss im ganzen Shop eindeutig sein (de und en).

## Beschreibung

70–110 Wörter pro Sprache, Du-Form. Leerzeile zwischen Blöcken, Listenpunkte
mit „– " (die Produktseite macht daraus eine Aufzählung):

```
<Absatz: 2–3 Sätze. Der erste Satz nennt Typ + Hauptmerkmal — er wird als
Google-Beschreibung verwendet (erste ~160 Zeichen). Dann Anlass: Strand, Pool, Ferien.>

– Oberteil: <Form, Träger, Verschluss>
– Höschen: <klassisch / brasilianisch / Tanga / hoch geschnitten, Bindebänder>
– Muster: <unifarben / Print / Streifen …>
– Details: <Rüschen, Ringe, Pailletten, Raffung, Cut-out … — weglassen, wenn nichts>
– Lieferumfang: <Oberteil und Höschen / … und Rock>

<1–2 Sätze Styling- oder Passform-Tipp.>
```

- Badeanzug: `– Schnitt:`, `– Rücken:`, `– Muster:`, `– Details:`.
- Englisch: `– Top:`, `– Bottoms:`, `– Pattern:`, `– Details:`, `– Includes:`; britische Schreibweise (colour).
- **Keine erfundenen Fakten:** Polsterung, Bügel, UV-Schutz, Material nur, wenn
  klar sichtbar oder in den Daten. Material und Pflege haben eigene Felder.
- Keine Superlative, keine Emojis, **keine Herkunftsangabe „aus der Schweiz"**
  (Ware kommt über CJ; „Schweizer Onlineshop" ist korrekt).
- Varianten einer Familie: gleiche Struktur, aber Einleitung und Muster-Zeile
  individuell formulieren — wortgleiche Texte wertet Google ab.

## Ablauf

1. **Bilder ansehen** — pro Produkt 2–4 Bilder (Hauptbild, Model, Rückseite).
   Bei vielen Produkten auf parallele Helfer aufteilen (je ~12 Produkte),
   Ausgabe je Batch als JSON `{ slug: { name_de, name_en, description_de, description_en } }`.
   Helfer zusätzlich notieren lassen, was **unsicher** ist — daraus ergeben sich
   Datenfehler, die Joel prüfen muss (siehe unten).
2. **Zusammenführen und prüfen:** eindeutige Namen (de und en), Länge, Wortzahl,
   kein „ß", wie viele Produkte pro Kategorie herauskommen. Eine Kategorie mit
   weniger als 2 Produkten aus `src/lib/categories.ts` entfernen.
3. **Probelauf** (schreibt nichts, legt aber ein Backup an):

   ```bash
   node tools/update-product-texts.mjs texte.json --dry-run
   ```

4. **Ein Produkt testen**, Live-Seite ansehen, dann alle:

   ```bash
   node tools/update-product-texts.mjs texte.json --only <slug>
   node tools/update-product-texts.mjs texte.json
   ```

   Erlaubte Felder: `name_de/en`, `description_de/en`, `material_de/en`, `care_de/en`.
   Preis, Bilder, Slug bleiben unberührt. Seiten aktualisieren sich sofort,
   der Google-Feed (`/feed/google.xml`) innerhalb einer Stunde.

5. **Kontrolle:** Produktseite (Titel, Aufzählung), Kategorieseiten (Anzahl),
   `/feed/google.xml` (neue `g:title`).

## Zurückspielen

Jeder Lauf legt `.tmp/product-texts-backup-<zeitstempel>.json` an — **das
Backup des ersten Laufs enthält den alten Stand.** Zurück mit:

```bash
node tools/update-product-texts.mjs .tmp/product-texts-backup-<zeitstempel>.json
```

Original vor der Umstellung vom 08.10.2026: `.tmp/seo/backup-originaltexte-2026-10-08.json`
(`.tmp/` ist wegwerfbar — bei Bedarf vorher woanders sichern).

## Bekannte Stolpersteine

- `tools/upsert-product.mjs` schreibt noch nach Supabase und funktioniert nicht
  mehr — die Datenbank ist MySQL bei Hostpoint und lokal nicht erreichbar.
  Produkttexte nur über `tools/update-product-texts.mjs` ändern.
- Live-Produktseiten werden bei jedem Aufruf aus der Datenbank gebaut und
  brauchen bis zu mehreren Sekunden. Beim Abrufen vieler Seiten per Skript immer
  ein Timeout setzen (ein Aufruf ohne Timeout hing beim ersten Versuch endlos).
- Beim Ansehen der Bilder fielen am 08.10.2026 Unstimmigkeiten zwischen Bildern
  und Farb-/Produktdaten auf (playa Ziegelrot anderes Modell, lucia nur „Weiss"
  in den Daten, costa ist Wickeltop + Rock statt Kleid, cumbre-leopard mit zwei
  verschiedenen Oberteilen, Micro-Push-up ohne sichtbaren Push-up → „String-Bikini").
  Joel hat die gewählten Namen und Texte dazu bestätigt; der Wickelrock beim
  Batik-Bikini (ola) wird wirklich mitgeliefert. Solche Funde nicht
  stillschweigend im Text glätten, sondern Joel melden.
