# Workflow: Instagram automatisieren

## Was automatisch läuft — und was nicht

| Schritt | Automatisch? |
|---|---|
| TikTok-Trends erheben | **nein** — keine freie Schnittstelle, Joel kopiert sie wöchentlich (10 Min.) |
| Themen, Hooks, Wochenplan ableiten | ja |
| Reels erzeugen (Video, Text, Layout) | ja |
| Captions und Hashtags schreiben | ja |
| **Instagram-Sound anhängen (Trending, Suche)** | **ja** — über Metas Audio API |
| Veröffentlichen und zeitlich planen | ja |
| Kommentare und DMs | nein (bewusst: bei kleiner Marke wirkt das unecht) |

### Musik über die Schnittstelle — was gilt

Meta stellt eine **Audio API** bereit: `GET /ig_audio` liefert ohne
Suchbegriff die Trending-Sounds, mit Suchbegriff Musik und Original Sounds;
beim Reel-Container hängt `audio_configuration={"audio_id":…}` den Sound an.
Das Tool nutzt genau das.

Was der Katalog tatsächlich enthält (getestet 02.10.2026):

- `audio_type=original_sound` — Sounds, die auf Reels gerade laufen
  (Creator-Audios, teils Remixe bekannter Songs)
- `audio_type=music` — Metas **lizenzfreie Sound Collection**

`audio_type` und `ig_user_id` sind Pflicht; die Antwort steht unter `audio`
(nicht `data`), die ID heisst `audio_id`. Das Tool fragt beide Typen ab.

Drei Einschränkungen, die man kennen muss:

- **Kleinerer Katalog als in der App.** Es kommt nur, was Meta für
  Drittanbieter freigegeben hat. Trending-Sounds und Original Sounds sind
  dabei; einzelne Chart-Hits fehlen. Für Business-Konten ist der kommerzielle
  Teil enger als für Creator-Konten.
- **Kein Trimmen.** Der Sound beginnt bei Sekunde 0.
- **Nur mit Facebook Login.** Der ältere „Instagram Login"-Weg kennt die
  Audio API nicht. Deshalb läuft die Einrichtung über eine Meta-App mit
  Facebook Login und die verknüpfte Facebook-Seite.

Ist ein gewünschter Sound nicht im Katalog, sagt das Tool das klar — dann
dieses eine Reel von Hand posten (60 Sekunden), alles andere läuft weiter.

## Einmalige Einrichtung (ca. 45 Minuten)

### 1. Instagram auf ein Business-Konto umstellen
App → Einstellungen → Konto → **Zu professionellem Konto wechseln** →
Kategorie „Bekleidungsgeschäft". Ein privates Konto kann die API nicht nutzen.

### 2. Facebook-Seite verknüpfen
Eine Facebook-Seite „Verano Exotico" ist Pflicht (ist für das automatische
Teilen ohnehin schon da). Instagram → Einstellungen → **Konten-Center** →
Konten hinzufügen → Facebook → die Seite verbinden.

### 3. Meta-App anlegen
1. https://developers.facebook.com → **Meine Apps → App erstellen**
2. Anwendungsfall: **Andere** → Typ: **Business**
3. Name `verano-exotico`, E-Mail `veranoexotico@gmail.com`
4. Dashboard → **Produkt hinzufügen → Facebook Login for Business → Einrichten**
5. **Einstellungen → Allgemein**: `App-ID` und `App-Geheimcode` kopieren →
   in `.env.local` als `FB_APP_ID` und `FB_APP_SECRET`

### 4. Token erzeugen

**Stolperstein (30.09.2026):** Im Graph API Explorer meldete der Dialog
zuerst „kein Instagram-Konto". Ursache: Instagram war nur übers Konten-Center
mit Facebook verknüpft, nicht mit der **Seite**. Lösung: Instagram (Web) →
Einstellungen → **Professionelles Konto** → Facebook **„Verknüpfen"** → Seite
wählen. Das Konten-Center allein genügt der Schnittstelle nicht.
1. https://developers.facebook.com/tools/explorer → oben rechts die App
   `verano-exotico` wählen
2. **Berechtigungen hinzufügen:** `instagram_basic`,
   `instagram_content_publish`, `instagram_manage_insights`,
   `pages_show_list`, `pages_read_engagement`
3. **Generate Access Token** → im Dialog Facebook-Konto, die Seite und das
   Instagram-Konto freigeben
4. Das angezeigte (kurzlebige) Token kopieren und in `.env.local` hinter
   `FB_SHORT_TOKEN=` einfügen (nicht in einen Chat), dann:

```bash
node tools/instagram-publish.mjs --setup
```

Das Tool tauscht es in ein dauerhaftes, sucht Seite und Instagram-Konto,
trägt `INSTAGRAM_USER_ID` und `INSTAGRAM_ACCESS_TOKEN` selbst ein und leert
`FB_SHORT_TOKEN`. Liegt die Seite in einem Business-Portfolio, fehlt sie in
`/me/accounts` — das Tool liest sie dann aus den `granular_scopes` des Tokens. Das
Seiten-Token **läuft nicht ab** — kein Kalendereintrag nötig.

### 5. ~~Vercel Blob~~ — entfällt
Das Tool lädt das Video direkt zu Meta hoch (`upload_type=resumable`). Eine
öffentliche Video-URL oder ein Zwischenspeicher ist nicht nötig. Vercel Blob
bleibt nur als Notlösung (`--via-blob`), falls Meta den Direkt-Upload einmal
ablehnt.

### 6. Werte eintragen
In `.env.local` (gitignored, verlässt den Rechner nie):

```bash
FB_APP_ID=…
FB_APP_SECRET=…
INSTAGRAM_ACCESS_TOKEN=EAA…        # Seiten-Token aus Schritt 4
INSTAGRAM_USER_ID=17841…           # aus Schritt 4
```

### 7. Prüfen

```bash
node tools/instagram-publish.mjs --profile
node tools/instagram-publish.mjs --list-audio
```

Erwartung: `@veranoexotico — N Follower, M Beiträge` und eine Liste
Trending-Sounds mit IDs. Kommt ein Fehler, steht er im Klartext da — meist
fehlt eine Berechtigung aus Schritt 4.

## Laufender Betrieb

```bash
# Trending-Sounds ansehen, oder gezielt suchen
node tools/instagram-publish.mjs --list-audio
node tools/instagram-publish.mjs --list-audio --query "summer beach"

# Probelauf: zeigt Video, Caption, Sound — lädt nichts hoch
node tools/instagram-publish.mjs --video .tmp/reels/x.mp4 --caption-file .tmp/reels/x.md --audio trending --dry-run

# Posten mit dem ersten Trending-Sound
node tools/instagram-publish.mjs --video .tmp/reels/x.mp4 --caption-file .tmp/reels/x.md --audio trending

# Posten mit einem bestimmten Sound (ID aus --list-audio)
node tools/instagram-publish.mjs --video … --caption-file … --audio-id 587784541076604

# Posten ohne Instagram-Sound (Tonspur des Videos)
node tools/instagram-publish.mjs --video … --caption-file …

# Zahlen der letzten Posts
node tools/instagram-publish.mjs --insights --limit 10
```

Die Caption wird aus dem Abschnitt `## Caption DE` der `.md`-Datei gelesen, die
`tools/make-reels-batch.mjs` neben jedes Video legt. Bei `--audio` wird die
Video-Tonspur standardmässig stummgeschaltet (`--video-volume 0`); die
erzeugten Reels sind ohnehin stumm.

## Grenzen der Schnittstelle

- **25 Beiträge pro 24 Stunden** (Meta-Limit). Bei 3 Posts pro Woche irrelevant.
- **Stories** gehen über die API (`--story`), aber nur für **Business**-Konten
  (nicht Creator), 3–60 s, ohne Caption und ohne Instagram-Sound. Reels
  erreichen auch Nicht-Follower — bei kleinem Konto zuerst als Reel posten.
- **Keine Karussells aus Videos** (nur Bilder).
- **Videoformat:** MP4, H.264, AAC, max. 100 MB, 3 Sekunden bis 15 Minuten,
  Seitenverhältnis 9:16. Die erzeugten Reels erfüllen das.
- **Verarbeitung dauert** 20 Sekunden bis mehrere Minuten. Das Tool fragt den
  Status ab, statt blind zu warten.
- **Musik:** nur der für Drittanbieter freigegebene Katalog, Start bei 0 s.

## Wenn etwas klemmt

| Meldung | Ursache |
|---|---|
| `INSTAGRAM_ACCESS_TOKEN … fehlt` | Schritt 6 nicht gemacht |
| `BLOB_READ_WRITE_TOKEN fehlt` | Schritt 5 nicht gemacht |
| `OAuthException (#190)` | Token ungültig → Schritt 4 wiederholen |
| `(#10) … does not have permission` | Berechtigung aus Schritt 4 fehlt |
| `(#100) … audio_configuration` | Audio API nur mit Facebook Login; Token stammt vom Instagram-Login-Weg → Schritt 3/4 |
| `Kein Sound gefunden` | Nicht im Drittanbieter-Katalog → anderen Sound wählen oder dieses Reel von Hand |
| `The user is not an Instagram Business` | Konto ist noch privat → Schritt 1 |
| Verarbeitung bleibt bei `ERROR` | Format prüfen: `ffprobe` auf die Datei, muss H.264/AAC sein |

## Sicherheit

- Das Token liegt **nur** in `.env.local` auf Joels Rechner. Kein Drittanbieter
  (Publora, Metricool, Later …) bekommt Zugriff auf das Konto.
- Die installierten Text-Skills unter `.claude/skills/ig-*` wurden von ihren
  Publora-, Apify- und Pixfaro-Teilen befreit; sie erzeugen nur Text.
- Das Token erlaubt Veröffentlichen und Statistiken lesen — keine Zahlungen,
  keine Kontoänderungen, kein Zugriff auf DMs.
