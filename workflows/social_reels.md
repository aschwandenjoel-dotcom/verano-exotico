# Workflow: Reels aus dem Katalog erzeugen

## Ziel
Aus Produktbildern, lizenzfreien Stimmungs-Clips und Text im Markendesign
9:16-Videos (1080×1920, 8 s) für Instagram Reels, TikTok und Pinterest
erzeugen — inkl. fertiger Captions (DE/EN) und Hashtags. Zweck: das Profil
regelmässig füllen, ohne für jeden Post ein Shooting zu brauchen.

Das ersetzt **nicht** Content mit echten Menschen in echten Produkten — das
bleibt der Content, der verkauft. Diese Reels sind der Unterbau dazwischen.

## Tools

| Tool | Aufgabe |
|---|---|
| `tools/pexels-clips.mjs` | Lädt Hochkant-Clips von Pexels nach `.tmp/clips/`, schreibt Nachweis in `index.json` |
| `tools/make-reel.mjs` | Ein Reel: Clip + Produktkarte + Headline + Preis + CTA |
| `tools/make-reels-batch.mjs` | Serie von Reels + Caption-Dateien + `INDEX.md` |

ffmpeg kommt als npm-Paket (`ffmpeg-static`), Schriften liegen in
`assets/fonts/` (Archivo Black, DM Serif Display, Geist Mono — alle OFL).

## Voraussetzungen
- `PEXELS_API_KEY` in `.env.local` — kostenlos unter https://www.pexels.com/api/
  (Limit: 200 Anfragen/Stunde, 20'000/Monat — reicht locker)
- Internet: Produktdaten kommen von `verano-exotico.ch/api/products` und dem
  Feed `/feed/google.xml` (Cache 6 h in `.tmp/products.json`)

## Ablauf

1. **Clips holen** (einmalig, dann nur bei Bedarf nachladen)
   ```bash
   node tools/pexels-clips.mjs --preset          # ~30 Clips: Wellen, Palmen, Sand, Pool, Sonnenuntergang
   node tools/pexels-clips.mjs --query "palm leaves shadow" --count 3
   ```
   Danach `.tmp/clips/` **sichten**: Clips mit erkennbaren Personen löschen
   (siehe Lizenz unten). Clips mit Logos/Hotels/Booten ebenfalls raus.

2. **Reels rendern**
   ```bash
   node tools/make-reels-batch.mjs --count 10             # die 10 neuesten Produkte
   node tools/make-reels-batch.mjs --products tanga-leopard,cumbre-leopard
   node tools/make-reels-batch.mjs --new                  # nur isNew-Produkte, Headline "Neu im Shop"
   node tools/make-reels-batch.mjs --count 10 --locale en # englische Variante
   node tools/make-reels-batch.mjs --count 5 --music .tmp/music/track.mp3
   ```
   Ergebnis in `.tmp/reels/`: pro Produkt `<slug>.mp4` + `<slug>.md`
   (Caption DE/EN + Hashtags) + `INDEX.md`.

3. **Posten** — von Hand in der Instagram-App (Reel hochladen, Caption aus der
   .md einfügen, Musik aus der Instagram-Bibliothek wählen, Produkt taggen
   sobald Instagram Shopping freigeschaltet ist). Rhythmus: 3–4 pro Woche,
   nicht alle auf einmal.

## Musik
Standardmässig ohne Ton. **Empfehlung: Musik erst in der Instagram-/TikTok-App
hinzufügen** — deren Bibliotheken sind für die Plattform lizenziert und die
Algorithmen bevorzugen Trend-Sounds. Eigene Musik per `--music` nur mit
nachweislich freier Lizenz (z. B. Pixabay Music, Mixkit).

## Lizenz — was erlaubt ist und was nicht
Pexels-Lizenz erlaubt kommerzielle Nutzung ohne Nennung. **Verboten:**
gezeigte Personen so darstellen, als würden sie das Produkt empfehlen oder
tragen. Deshalb: **nur Clips ohne Menschen** (oder Menschen nur als winzige
Silhouetten in der Ferne). Der Preset fragt entsprechend nur Landschaft,
Wasser, Pflanzen und Texturen ab. `index.json` hält Pexels-ID und Urheber:in
fest — falls je eine Frage aufkommt.

## Design-Regeln (im Tool fest verdrahtet)
- Farben: Sand `#F8F3E8`, Marine `#1A3040`, Gold `#D4AF37` (wie Website)
- Headline: Zeile 1 Archivo Black versal creme, Zeile 2 DM Serif kursiv gold — wie der Hero
- Eyebrow und Produktzeile in Geist Mono mit Buchstabenabstand
- Produktkarte 800×1000, abgerundet, weicher Schatten, blendet nach 0.5 s ein
- Hintergrund leicht abgedunkelt + Vignette + langsamer Zoom (10 % über 8 s)
- CTA-Balken gold mit Domain
- Schriftgrösse verkleinert sich automatisch bei langen Texten

Headline-Varianten und Caption-Texte stehen oben in `make-reels-batch.mjs` —
dort ergänzen, wenn neue Saison-Themen kommen (z. B. „Skiferien? Nein, Strand.").

## Bekannte Grenzen
- Kein automatisches Posten. Die Instagram-Graph-API (`scripts/instagram-mcp.mjs`)
  könnte Reels veröffentlichen, braucht aber ein Business-Konto, Facebook-Seite
  und Token in `.env.local` — noch nicht eingerichtet.
- Produktbilder sind Freisteller auf Weiss vom Lieferanten; die Karte ist
  daher immer weiss. Bei eigenen Fotos mit Hintergrund sieht es besser aus.
- Pexels-Suche liefert manchmal Querformat-Clips trotz `orientation=portrait`;
  das Tool filtert auf Hochkant, dadurch kommen pro Suche weniger Treffer.

## Gelernt
- `crop` mit zeitabhängiger Grösse ist in ffmpeg nicht erlaubt (Ausgabegrösse
  muss konstant sein) → langsamer Zoom über `zoompan` mit `z='1+0.10*in/N'`
  (Eingangsframe-Nummer `in`, nicht `zoom`, das pro Frame zurückgesetzt wird).
- `drawtext` kennt kein letter-spacing → Leerzeichen zwischen Buchstaben.
- Homebrew ist auf diesem Rechner nicht schreibbar → `ffmpeg-static` per npm.
- `/api/products` liefert keine Farbbilder; der Feed schon → Bild aus dem Feed.
