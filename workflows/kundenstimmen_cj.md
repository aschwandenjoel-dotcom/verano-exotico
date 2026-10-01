# Kundenstimmen von CJ einsammeln und anzeigen

**Ziel:** Die echten Käuferkommentare, die bei CJdropshipping an unseren
Modellen hängen, auf die Startseite und unter jedes Produkt bringen — einer
nach dem anderen, automatisch weiterschaltend.

**Wie oft:** Alle paar Wochen, oder wenn neue Produkte im Shop sind. Es ist ein
reiner Lesezugriff auf die CJ-API und kostet kein Guthaben.

---

## Eingaben

| Was | Woher |
|---|---|
| `CJ_API_KEY` | `.env.local` — derselbe Key wie für die Bestellabwicklung (CJ-Dashboard → Authorization → API-Key). Siehe `DROPSHIPPING_SETUP.md`. |
| Produkt-Mapping | `src/lib/cjMapping.ts` — daraus kommt je Slug eine vid |
| Aktive Produkte | `https://verano-exotico.ch/api/products` — nur was im Shop steht, wird abgefragt |

## Ablauf

1. **Vorschau ohne zu schreiben**

   ```bash
   node tools/cj-reviews.mjs --dry-run
   ```

   Gibt je Produkt aus, wie viele Kommentare CJ hat und wie viele übernommen
   würden, plus eine Textvorschau. Dauert bei ~60 Produkten rund drei Minuten
   (1.2 s Pause zwischen den Aufrufen, die CJ-API lässt etwa einen pro Sekunde zu).

2. **Übernehmen**

   ```bash
   node tools/cj-reviews.mjs
   ```

   Schreibt `src/data/customer-voices.json`.

3. **Durchsehen und übersetzen — Pflicht, nicht Kür.** Das macht der Agent von
   Hand, nicht das Tool (siehe „Übersetzen" unten). Beim ersten Lauf
   (30.09.2026) blieben von 33 eingesammelten Kommentaren **10** übrig.

4. **Deployen.** Die Datei wird beim Build eingebacken — ohne Deploy ändert sich
   auf der Seite nichts.

## Ausgabe

`src/data/customer-voices.json` → wird von `src/components/ui/CustomerVoices.tsx`
gelesen. Die Komponente hat zwei Darstellungen:

| `variant` | Wo | Was |
|---|---|---|
| `marquee` | Startseite, zwischen Shop-Reihe und „Trends are temporary" | Kommentarboxen laufen endlos von links nach rechts, Sprechblasen-Optik |
| `rotator` (Standard) | Produktseite, über den eigenen Shop-Bewertungen | eine Stimme nach der anderen, eingeblendet, mit Pfeilen und Punkten |

Beide halten an, sobald Maus oder Tastaturfokus darauf liegt. Bei „Bewegung
reduzieren" im Betriebssystem steht das Laufband still und lässt sich wischen.

Tempo und Richtung stehen in `globals.css` unter `@keyframes voiceMarquee`:
Für die andere Laufrichtung die beiden `translateX`-Werte tauschen. Die Dauer
rechnet die Komponente aus der Anzahl Karten (7 s pro Karte, mindestens 28 s).

Ist `voices` leer, rendert die Sektion **nichts**. Das ist Absicht: lieber keine
Sektion als Platzhalter.

## Stellschrauben

```bash
node tools/cj-reviews.mjs --lang all        # auch spanische, französische … Kommentare
node tools/cj-reviews.mjs --min-score 5     # nur 5 Sterne
node tools/cj-reviews.mjs --per-product 5   # mehr je Produkt
node tools/cj-reviews.mjs --pages 3         # tiefer graben (3 × 20 Kommentare je Produkt)
node tools/cj-reviews.mjs marea-bikini      # nur ein Produkt nachziehen
```

Standard ist `--lang de,en`, ab 4 Sternen, höchstens 3 je Produkt und 60
insgesamt. Kommentare unter 20 Zeichen oder unter 4 Wörtern fliegen raus
(„good", „👍"), ebenso Duplikate — CJ zeigt denselben Text gern an mehreren
Modellen.

## Übersetzen — und wo die Grenze liegt

Die Kommentare kommen in vielen Sprachen und teils als kaputte
Maschinenübersetzung. Deshalb wird nach dem Import von Hand übersetzt. Dabei
gilt:

| Fall | Was damit passiert |
|---|---|
| Original in echter Sprache (RU, UA, FR, PL …) | **getreu** ins Englische übersetzen |
| Verständliches, nur holpriges Englisch | sprachlich glätten, Aussage unverändert |
| Kaputtes Maschinen-Englisch ohne Original („The fabric of Garna", „Excellent gender quality") | **weglassen** — hier müsste man raten, was gemeint war |
| Widersprüchlich (5 Sterne, im Text eine Beschwerde) | weglassen |
| Lobt den **Verkäufer**, nicht das Produkt („Seller very responsive", „sent very fast", „second swimsuit from this shop") | weglassen — auf unserer Seite liest das jeder als unseren Service, den diese Käuferinnen nie erlebt haben |

Je Eintrag bleibt der CJ-Rohtext in `original` stehen, die gezeigte Fassung in
`comment`, dazu `translated: true/false`. So ist jederzeit prüfbar, was
tatsächlich dastand. Die Herkunftszeile unter der Sektion sagt deshalb auch
„und aus dem Original übersetzt".

## Was dabei gilt

Die Kommentare stammen von Käuferinnen **derselben Modelle über CJ**, nicht von
Bestellungen im eigenen Shop. Deshalb:

- Übersetzt wird **getreu**, nach den Regeln oben. Was sich nicht übersetzen
  lässt, wird weggelassen statt ausgedacht.
- Unter der Sektion steht eine kurze Zeile zur Herkunft. Die bleibt drin. Sie
  wegzulassen wäre irreführende Werbung (UWG Art. 3 Abs. 1 lit. b; in der EU
  Richtlinie 2005/29 Anhang I Nr. 23b) und verstösst gegen die Richtlinien des
  Google Merchant Center, über das der Produktfeed läuft — dort kostet das im
  Ernstfall das Konto.
- Das Badge **„Verifizierter Kauf"** bleibt den echten Shop-Bewertungen
  vorbehalten (`ReviewSection`, siehe `REVIEWS_SETUP.md`). Die CJ-Stimmen
  bekommen es nie.

## Wie viel überhaupt da ist (Stand 30.09.2026)

Ernüchternd: Von 57 aktiven Produkten haben **4** Kommentare. Zwei Modelle
tragen praktisch alles — Tres Puntos (58) und Selva Floral (64) —, der Rest hat
null bis eins. Fast alle stammen aus **2020**. Deshalb zeigt die Sektion
bewusst **kein Datum** an; erfunden wird natürlich keines, es steht weiterhin im
JSON.

Heisst für die Erwartung: Die Sektion lebt auf der Startseite und auf vier
Produktseiten. Die übrigen 53 zeigen nichts — das ist richtig so, nicht kaputt.
Mehr Masse gäbe nur `--lang all`, dann aber auf Russisch und Japanisch.

## Gelerntes über die CJ-API

- `GET /product/productComments?pid=…&pageNum=&pageSize=` liefert die
  Kommentare. **Die Doku sagt `code: 0`, live kam `code: 200`** — das Tool
  akzeptiert beides. Wer nur eine der beiden Varianten prüft, hält
  erfolgreiche Antworten für Fehler.
- Die Antwort enthält `pointsInfo`: Aufrufe kosten Punkte. Guthaben lag bei
  **50 000**, ein kompletter Lauf über alle Produkte braucht **114 Aufrufe**.
  Das ist unkritisch, aber es ist nicht unbegrenzt.
- Die Kommentartexte enthalten **HTML-Entities** im Klartext — numerisch
  (`seller&#39;s`) und benannt (`qualit&eacute;`). Beides muss dekodiert
  werden, Node bringt dafür nichts mit (siehe `decodeEntities` im Tool).
- CJ liefert bei den Ländern teils **Nicht-ISO-Codes**: `UK` statt `GB`. Daraus
  entsteht kein Flaggen-Emoji, sondern zwei Buchstaben in Kästchen
  (`COUNTRY_ALIASES` in `CustomerVoices.tsx`).
- **`commentId` ist nicht eindeutig.** Bei `costa-alta-highwaist-bikini` teilten
  sich drei verschiedene Kommentare die ID `1666381276967874600`. Als React-key
  verschluckt das Einträge. Das Tool vergibt deshalb eine eigene `id` (SHA1 über
  Slug + Text, 12 Zeichen); die Original-ID steht in `cjCommentId`.
- Kommentare hängen an der **pid**, `cjMapping.ts` kennt nur **vids**. Der Weg
  dazwischen ist `GET /product/variant/queryByVid?vid=…`. Die pids landen im
  Ergebnis-JSON unter `pids` und werden beim nächsten Lauf wiederverwendet —
  das spart je Produkt einen Aufruf.
- vids gibt es in zwei Formaten: rein numerisch (`1796048609918595072`) und als
  UUID (`285F18DA-0690-…`). Wer nur Zahlen sucht, verliert fünf Produkte.
- `getAccessToken` ist auf **einen Aufruf pro 300 Sekunden** begrenzt, der Token
  hält 15 Tage. Er wird in `.tmp/cj-token.json` zwischengespeichert; bei
  „too many requests" auf dem Login also erst dort nachsehen.
- Ein Produkt ohne Kommentare oder mit gelöschter Variante wird übersprungen,
  der Lauf bricht nicht ab.
