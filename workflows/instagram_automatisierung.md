# Workflow: Instagram automatisieren

## Was automatisch läuft — und was nicht

| Schritt | Automatisch? |
|---|---|
| TikTok-Trends erheben | **nein** — keine freie Schnittstelle, Joel kopiert sie wöchentlich (10 Min.) |
| Themen, Hooks, Wochenplan ableiten | ja |
| Reels erzeugen (Video, Text, Layout) | ja |
| Captions und Hashtags schreiben | ja |
| Veröffentlichen und zeitlich planen | ja |
| **Instagram-Sound / Trend-Musik** | **nein — technisch unmöglich** |
| Kommentare und DMs | nein (bewusst: bei kleiner Marke wirkt das unecht) |

### Warum keine Musik

Meta gibt die lizenzierte Musikbibliothek **nicht** über die Graph API frei.
Ein per API veröffentlichtes Reel trägt nur den Ton, der in der Datei steckt.
Daraus folgt die Arbeitsteilung:

- **Automatisch:** Katalog- und Nutzen-Reels, stumm oder mit eigener
  lizenzfreier Tonspur. Laufen ohne Zutun nach Plan.
- **Von Hand:** Reels, die von einem Trend-Sound leben — der stärkste
  Reichweitenhebel. Der Skill bereitet sie vollständig vor
  (`.tmp/reels/manuell/`), Joel wählt beim Hochladen den Sound. 60 Sekunden.

Wer das anders verspricht, kennt die API nicht.

## Einmalige Einrichtung (ca. 45 Minuten)

### 1. Instagram auf ein Business-Konto umstellen
App → Einstellungen → Konto → **Zu professionellem Konto wechseln** →
Kategorie „Bekleidungsgeschäft". Ein privates Konto kann die API nicht nutzen.

### 2. Facebook-Seite verknüpfen
Eine Facebook-Seite „Verano Exotico" ist Pflicht, auch wenn sie leer bleibt.
Instagram → Einstellungen → **Konten-Center** → Konten hinzufügen → Facebook.
(War für das automatische Teilen ohnehin schon nötig.)

### 3. Meta-App anlegen
1. https://developers.facebook.com → **Meine Apps → App erstellen**
2. Anwendungsfall: **Andere** → Typ: **Business**
3. Name `verano-exotico`, E-Mail `veranoexotico@gmail.com`
4. Im Dashboard: **Produkt hinzufügen → Instagram → Einrichten**

### 4. Token erzeugen
1. In der App: **Instagram → API-Einrichtung mit Instagram-Login**
2. Bei **„Instagram-Konten hinzufügen"** das Konto `@veranoexotico` verbinden
3. **Token generieren** → Berechtigungen bestätigen:
   `instagram_business_basic`, `instagram_business_content_publish`,
   `instagram_business_manage_insights`
4. Das angezeigte Token kopieren — es ist **60 Tage** gültig
5. Die **Instagram-User-ID** steht auf derselben Seite

### 5. Vercel Blob anlegen (Video-Zwischenspeicher)
Instagram lädt Videos nur von einer öffentlich erreichbaren HTTPS-Adresse.
Statt die Dateien ins Git-Repository zu legen (150 Videos pro Jahr × 8 MB
blieben dort für immer), landen sie kurz im Blob-Speicher und werden nach dem
Posten gelöscht.

1. Vercel → Projekt `verano-exotico` → **Storage → Create Database → Blob**
2. Name `verano-media` → Create
3. Reiter **`.env.local`** → `BLOB_READ_WRITE_TOKEN` kopieren

```bash
npm i @vercel/blob
```

### 6. Werte eintragen
In `.env.local` (gitignored, verlässt den Rechner nie):

```bash
INSTAGRAM_ACCESS_TOKEN=IGQVJ…
INSTAGRAM_USER_ID=17841…
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_…
```

### 7. Prüfen

```bash
node tools/instagram-publish.mjs --profile
```

Erwartung: `@veranoexotico — N Follower, M Beiträge`. Kommt ein Fehler, steht
er im Klartext da — meist fehlt eine Berechtigung aus Schritt 4.

## Laufender Betrieb

```bash
# Probelauf: zeigt Video, Caption und Länge, lädt nichts hoch
node tools/instagram-publish.mjs --video .tmp/reels/x.mp4 --caption-file .tmp/reels/x.md --dry-run

# Wirklich posten
node tools/instagram-publish.mjs --video .tmp/reels/x.mp4 --caption-file .tmp/reels/x.md

# Zahlen der letzten Posts
node tools/instagram-publish.mjs --insights --limit 10
```

Die Caption wird aus dem Abschnitt `## Caption DE` der `.md`-Datei gelesen, die
`tools/make-reels-batch.mjs` neben jedes Video legt.

### Token verlängern

Das Token läuft nach 60 Tagen ab.

```bash
node tools/instagram-publish.mjs --refresh-token
```

Gibt ein neues Token aus, das in `.env.local` gehört. **Kalendereintrag alle
50 Tage anlegen** — ist das Token einmal abgelaufen, hilft nur Schritt 4 von
vorn.

## Grenzen der Schnittstelle

- **25 Beiträge pro 24 Stunden** (Meta-Limit). Bei 3 Posts pro Woche irrelevant.
- **Keine Stories** über die API.
- **Keine Karussells aus Videos** (nur Bilder).
- **Videoformat:** MP4, H.264, AAC, max. 100 MB, 3 Sekunden bis 15 Minuten,
  Seitenverhältnis 9:16. Die erzeugten Reels erfüllen das.
- **Verarbeitung dauert** 20 Sekunden bis mehrere Minuten. Das Tool fragt den
  Status ab, statt blind zu warten.

## Wenn etwas klemmt

| Meldung | Ursache |
|---|---|
| `INSTAGRAM_ACCESS_TOKEN … fehlt` | Schritt 6 nicht gemacht |
| `BLOB_READ_WRITE_TOKEN fehlt` | Schritt 5 nicht gemacht |
| `OAuthException: Invalid OAuth access token` | Token abgelaufen → Schritt 4 wiederholen |
| `(#10) Application does not have permission` | Berechtigung aus Schritt 4 fehlt |
| `The user is not an Instagram Business` | Konto ist noch privat → Schritt 1 |
| `Media ID is not available` | Video noch in Verarbeitung — das Tool wartet automatisch |
| Verarbeitung bleibt bei `ERROR` | Format prüfen: `ffprobe` auf die Datei, muss H.264/AAC sein |

## Sicherheit

- Das Token liegt **nur** in `.env.local` auf Joels Rechner. Kein Drittanbieter
  (Publora, Apify, Buffer …) bekommt Zugriff auf das Konto.
- Die installierten Text-Skills unter `.claude/skills/ig-*` wurden von ihren
  Publora-, Apify- und Pixfaro-Teilen befreit; sie erzeugen nur Text.
- Das Token erlaubt Veröffentlichen und Statistiken lesen — keine Zahlungen,
  keine Kontoänderungen, kein Zugriff auf DMs.
