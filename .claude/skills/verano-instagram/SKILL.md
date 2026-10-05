---
name: verano-instagram
description: "Steuert den kompletten Instagram-Auftritt von Verano Exotico: nimmt die wöchentlichen TikTok-Trends entgegen, leitet daraus Themen und Hooks ab, wählt Produkte aus dem Katalog, erzeugt die Reels, schreibt Captions, veröffentlicht direkt über die Instagram Graph API und stellt das TikTok-Wochenpaket zum Planen in TikTok Studio zusammen. Nutze diesen Skill bei allem rund um Instagram, TikTok, Reels, Wochenplan, Posting, TikTok-Trends oder Social Content für diesen Shop — auch bei 'was poste ich heute', 'neue Reels', 'TikTok-Paket', 'Trends auswerten' oder 'Woche planen'."
---

# Instagram-Autopilot für Verano Exotico

Dieser Skill ist die Klammer um die Werkzeuge im Projekt und die Text-Skills
(`ig-caption-writer`, `ig-hook-extractor`, `ig-hashtag-strategist`,
`ig-content-planner`, `ig-humanizer`). Er entscheidet, was gepostet wird, lässt
es erzeugen und veröffentlicht es.

## Grundlagen, die immer gelten

- **Marke:** Bademode aus der Schweiz, Ferienbikinis ab CHF 27. Positionierung
  gegen Calzedonia/Oysho (Preis, Schweizer Shop, TWINT), **nicht** gegen
  nachhaltige Premium-Labels. Nie "nachhaltig" oder "Swiss Made" behaupten —
  die Ware kommt von CJ aus China. Siehe `workflows/social_reels.md`.
- **Konto:** `@veranoexotico`, Shop `https://verano-exotico.ch`.
- **Sprache:** Deutsch. Englische Captions liegen in jeder `.md` daneben, der
  Wechsel auf Englisch kommt später (Joels Entscheidung vom 20.09.2026).
- **Rhythmus:** 3 Posts pro Woche (Mo/Mi/Fr, abends 18–20 Uhr), auf
  Instagram und TikTok dieselben Videos. Mehr TikTok-Posts erst, wenn Joel
  die 15–20 Minuten pro Woche zuverlässig schafft.
- **Mischung pro Woche:** 1× Produkt-Reel, 1× Nutzen-Reel (Liste/Beratung),
  1× Persönliches oder Kundenstimme.

## Musik: automatisch über die Audio API

Metas Audio API liefert Trending-Sounds und Suche (`--list-audio`), und das
Publishing-Tool hängt den Sound beim Veröffentlichen an (`--audio trending`,
`--audio "<suche>"`, `--audio-id <id>`). Das ist der Normalfall — Reels gehen
**mit** Sound raus.

Zwei Grenzen, die man kennen und beim Planen berücksichtigen muss:

- **Kleinerer Katalog als in der App:** nur Musik, die Meta für Drittanbieter
  freigegeben hat. Trending-Sounds und Original Sounds sind dabei; einzelne
  Chart-Hits fehlen. Vor dem Planen `--list-audio` ansehen und aus dem
  wählen, was da ist — nicht aus dem, was in der TikTok-Liste steht.
- **Kein Trimmen:** der Sound startet bei Sekunde 0. Reels auf 8–15 s halten,
  damit der Einstieg des Sounds zum Video passt.

**Sound immer bewusst per `--audio-id` wählen, nie blind `--audio trending`.**
Die Trending-Liste enthält Creator-Remixe beliebiger Songs (auch Rap mit
explicit lyrics) — der erste Treffer passt selten zu einer Bademode-Marke.
Vorgehen: `--list-audio --query "<stimmung>"` (z. B. `summer`, `beach`,
`tropical`, `chill`), Vorschau-Link anhören, ID wählen. `[Musik]`-Treffer
(Sound Collection) sind lizenzfrei und für Werbung unbedenklich;
`[Original]`-Treffer sind trendiger, aber einzeln auf Markenfit prüfen.

Meldet das Tool `Kein Sound gefunden`, ist der Wunsch-Sound nicht freigegeben.
Dann: nächstbesten Trending-Sound nehmen. Nur wenn ein bestimmter Sound
unverzichtbar ist, dieses eine Reel in `.tmp/reels/manuell/` legen und Joel
posten lassen (60 Sekunden) — das ist die Ausnahme, nicht die Regel.

## Wöchentlicher Ablauf

### 1. Trends aufnehmen (Montag, Joel liefert)

Joel öffnet das [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?countryCode=CH)
(eingeloggt mit dem Business-Konto) und kopiert:

- **Hashtags:** Top 10 für die Schweiz, letzte 7 Tage
- **Songs:** Top 10 aufsteigend ("Breakout"), Schweiz, **Filter „Approved
  for business use“ eingeschaltet**. Nur diese Sounds darf ein Business-Konto
  auf TikTok verwenden (kommerzielle Musikbibliothek, seit 25.07.2025 streng
  durchgesetzt). Sie sind die Quelle für die TikTok-Sound-Vorschläge.
- **Top Ads / Videos:** 3 Beispiele aus Mode/Bekleidung, jeweils den Aufbau
  in einem Satz (was passiert in den ersten 2 Sekunden?)

Eine freie API dafür gibt es nicht (getestet: `creative_radar_api` antwortet
`no permission`). Wenn Joel nichts liefert, mit dem letzten Stand aus
`.tmp/trends/` weiterarbeiten und das sagen.

Das Ergebnis als `.tmp/trends/YYYY-MM-DD.md` ablegen.

### 2. Themen ableiten

Aus den Trends **Formate und Hooks** übernehmen, nicht die Inhalte kopieren.
Der `ig-hook-extractor`-Skill zerlegt ein Beispiel in seine Hook-Formel; die
Formel auf Bademode übertragen. Faustregeln:

- Jeder Trend-Hook muss in 2 Sekunden funktionieren und ohne Ton verständlich
  sein (viele sehen Reels stumm).
- Ein Thema pro Post, nicht drei.
- Saison beachten: Sept–März ist **Ferienbikini** (Thailand, Malediven,
  Kanaren, Dubai), nicht "Sommer".

### 3. Reels erzeugen

```bash
# Produkt-Reels (die neuesten Artikel)
node tools/make-reels-batch.mjs --count 3

# Nutzen-Reel: mehrere Produkte unter einer Headline
node tools/make-list-reel.mjs --clip .tmp/clips/<clip>.mp4 \
  --title "5 Ferienbikinis" --sub "unter CHF 40." \
  --products slug1,slug2,slug3,slug4,slug5

# Neue Stimmungs-Clips, wenn die vorhandenen ausgereizt sind
node tools/pexels-clips.mjs --query "<motiv>" --count 3
```

Clips **ohne Menschen** verwenden — die Pexels-Lizenz verbietet, gezeigte
Personen als Werbeträger für das eigene Produkt darzustellen. Details in
`workflows/social_reels.md`.

### 4. Captions schreiben

Den `ig-caption-writer`-Skill nutzen, dann `ig-humanizer` drüberlaufen lassen.
Hashtags über `ig-hashtag-strategist`, aber immer mit Schweiz-Bezug
(`#schweiz #zürich #swissbrand`) und Ferienzielen.

Jede Caption endet mit dem Link zur Produkt- oder Collection-Seite. Preise
immer nennen — der Preis ist das Unterscheidungsmerkmal.

### 5. Veröffentlichen

```bash
# Sounds sichten (Trending oder Suche)
node tools/instagram-publish.mjs --list-audio
node tools/instagram-publish.mjs --list-audio --query "summer beach"

# Posten mit Trending-Sound
node tools/instagram-publish.mjs --video .tmp/reels/<name>.mp4 \
  --caption-file .tmp/reels/<name>.md --audio trending

# Posten mit bestimmtem Sound
node tools/instagram-publish.mjs --video … --caption-file … --audio-id <id>

# Nur prüfen, was passieren würde
node tools/instagram-publish.mjs --video … --caption-file … --audio trending --dry-run
```

Das Tool legt den Media-Container an (mit `audio_configuration`), lädt das
Video direkt zu Meta hoch (`upload_type=resumable`, kein Zwischenspeicher),
wartet auf die Verarbeitung und veröffentlicht. Mit `--prepare-only` läuft
alles ausser dem Veröffentlichen — zum Testen. Voraussetzungen und Einrichtung:
`workflows/instagram_automatisierung.md`.

Fehlt der Token, bricht es mit einer klaren Meldung ab — dann den Post als
"von Hand" in `.tmp/reels/manuell/` legen und Joel Bescheid geben.

### 5b. TikTok-Paket (Joel plant in TikTok Studio)

TikTok lässt sich nicht selbst automatisch posten: Über die API
veröffentlichte Videos bleiben privat, bis TikTok die App prüft — und
Werkzeuge fürs eigene Konto werden in der Prüfung ausdrücklich abgelehnt.
Trend-Sounds lassen sich über keine API anhängen (auch nicht über Buffer &
Co.). Deshalb: Paket vorbereiten, Joel lädt es in **TikTok Studio** hoch,
wählt den Sound und plant — TikTok veröffentlicht dann selbst (bis 10 Tage
im Voraus).

1. In jede Reel-`.md` einen Abschnitt `## TikTok` mit 2–3 Sound-Vorschlägen
   aus Joels Songs-Liste (nur „Approved for business use“) schreiben, passend
   zur Stimmung des Videos. Optional eine eigene TikTok-Caption — sonst baut
   das Tool die deutsche Instagram-Caption um (URL raus, 5 Hashtags).

   ```markdown
   ## TikTok
   Sounds: Titel A – Künstler | Titel B – Künstler | Titel C – Künstler
   Caption:
   Hook in der ersten Zeile …
   ```

2. Paket bauen (Reihenfolge = Posting-Reihenfolge):

   ```bash
   node tools/tiktok-package.mjs --reels name1,name2,name3 [--start JJJJ-MM-TT] [--days mo,mi,fr] [--time 19:00]
   ```

   Ergebnis: `.tmp/tiktok/<datum>/` mit `PLAN.md` (Schritt-für-Schritt,
   Termine, Sounds, Captions), den Videos und je einer `.txt` zum Kopieren.

3. Joel den Ordner nennen. Das Paket muss vor dem ersten Termin hochgeladen
   sein; Termine über 10 Tage voraus meldet das Tool als Hinweis.

Voraussetzung: TikTok-**Business**-Konto (Planen gibt es nur für Creator-
und Business-Konten; als Shop sind wir ohnehin an die kommerzielle
Musikbibliothek gebunden). In TikTok Studio bei jedem Post „Werbeinhalte →
Deine Marke“ einschalten. Website-Link in der TikTok-Bio pflegen — Links
in Captions sind nicht klickbar.

### 6. Nachfassen

Am Tag nach einem Post die Zahlen holen und die nächste Woche anpassen:

```bash
node tools/instagram-publish.mjs --insights --limit 10
```

Was funktioniert, öfter machen. Was nach drei Versuchen nicht funktioniert,
streichen — nicht endlos variieren.

## Was dieser Skill nicht tut

- **Keine Kommentare und DMs beantworten.** Das bleibt bei Joel; automatische
  Antworten wirken bei einer kleinen Marke sofort unecht.
- **Keine Follower kaufen, keine Massen-Follows.** Instagram sperrt das, und es
  bringt keine Käuferinnen.
- **Keine erfundenen Bewertungen oder Testimonials.**
- **Keine fremden Reels nachbauen, die erkennbar von einem Konto stammen.**
  Formate ja, Inhalte nein.

## Stand der Einrichtung

**Eingerichtet am 02.10.2026** (`--profile` antwortet). Fehlen
`INSTAGRAM_ACCESS_TOKEN` oder `INSTAGRAM_USER_ID` in `.env.local`, Joel durch
`workflows/instagram_automatisierung.md` führen. Wenn
nicht: Joel durch `workflows/instagram_automatisierung.md` führen (ca. 45
Minuten, einmalig). Das Seiten-Token aus dem Facebook Login läuft nicht ab.
