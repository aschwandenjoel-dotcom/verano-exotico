# Gemini-Prompt: erstes Instagram-Bild

Abgeleitet aus dem echten Design der Website (`src/components/landing/VTLanding.tsx`,
`src/app/globals.css`, `src/messages/de.json`). Nichts hiervon ist erfunden.

## Die Designsprache der Seite

| Element | Wert |
|---|---|
| Hintergrund | `#F8F3E8` warmes Sandweiss |
| Text / Dunkel | `#1A3040` tiefes Marineblau |
| Akzent | `#D4AF37` Gold |
| Tiefes Ozeanblau | `#0A3D52` |
| Seafoam | `#E4F4F7` |
| Headline-Schrift | Archivo Black, Grossbuchstaben, Laufweite -0.02em |
| Akzent-Schrift | DM Serif Display, *kursiv*, in Gold |
| Kleintext | Geist Mono, 10px, Grossbuchstaben, Laufweite 0.3em |
| Claim | „Golden Days, Timeless Wear." |
| Bildsprache | Goldene Stunde, Gegenlicht, Atlantik, warme Hauttoene |

Der Hero der Seite ist bewusst reduziert: viel leere Sandflaeche, eine riesige
zweizeilige Headline (Zeile 1 marineblau versal, Zeile 2 gold kursiv), oben eine
Zeile Mono-Kleintext, unten links ein kurzer Absatz und rechts ein goldener Button.

---

## Referenzbilder (aus `assets/instagram/referenzen/`)

| Datei | Wofuer Gemini sie nutzen soll |
|---|---|
| `1-logo.png` | Exakte Markenzeichnung und Logofarben |
| `2-lichtstimmung.png` | Lichtstimmung: Gegenlicht, goldene Stunde, Palmen |
| `3-strand-lifestyle.webp` | Strand, Wasser, Sandtoene, Weite |
| `4-produkt-passform.jpg` | Machart der Bademode (gerippt, High Waist) |

Alle vier zusammen anhaengen.

---

## Prompt A — kompletter Post mit Typografie

> Editorial fashion Instagram post, 4:5 portrait, for a swimwear brand called
> "Verano Exótico". Split composition: the left 45% is a flat warm sand-white
> field (#F8F3E8) with a very subtle film grain; the right 55% is a photograph.
>
> The photograph: a woman on an Atlantic beach at golden hour, shot into the
> low sun so her hair and shoulders are rimmed with warm light, wearing a
> ribbed high-waist bikini in deep navy. Shallow depth of field, soft lens
> flare, wet sand and turquoise surf blurred behind her. Warm, slightly faded
> analogue colour grade — like Portra 400. She is cropped from mid-thigh up and
> looks away from camera. Natural, relaxed, not posed for the lens.
>
> On the sand-white field, left aligned with generous margins:
> - top: the tiny line "SOMMER 2026 · NEUE KOLLEKTION" in a monospace typeface,
>   uppercase, 10px, letter-spacing 0.3em, in muted navy at 40% opacity
> - centre: a two-line headline. Line one "GOLDEN DAYS," in a very heavy
>   grotesque (Archivo Black), uppercase, deep navy #1A3040, tight letter-spacing.
>   Line two "Timeless Wear." in an elegant serif italic (DM Serif Display), in
>   gold #D4AF37, same optical size, mixed case.
> - bottom: a small gold #D4AF37 rectangle button with "IN DEN SHOP →" in heavy
>   uppercase navy, 11px, letter-spacing 0.25em
>
> A hairline rule in navy at 10% opacity separates the two halves. No other
> text, no logo, no watermark, no UI elements, no borders around the image.
> Calm, expensive, restrained — Scandinavian editorial layout meets tropical
> light. Lots of negative space.

**Einstellungen:** Seitenverhaeltnis 4:5, Aufloesung 2K.

---

## Prompt B — nur das Foto, Text kommt separat drauf

Bildmodelle setzen Schrift oft fehlerhaft (verdrehte Buchstaben, falsche
Umlaute). Fuer ein sauberes Ergebnis das Foto generieren und die Typografie
danach in Canva/Figma mit den echten Schriften setzen.

> Editorial swimwear photograph, 4:5 portrait. A woman on an Atlantic beach at
> golden hour, shot into the low sun so her hair and shoulders carry a warm rim
> light. She wears a ribbed high-waist bikini in deep navy. She stands in ankle
> deep turquoise water on wet sand, looking off to the left, relaxed and
> unposed. Shallow depth of field, soft natural lens flare, warm faded analogue
> grade like Kodak Portra 400, fine film grain.
>
> Important: compose with a large empty area of bright sky and pale sand in the
> upper left third of the frame, clean and uncluttered, so text can be placed
> there later. No text, no logo, no watermark.

Darauf dann in dieser Reihenfolge setzen:
1. `SOMMER 2026 · NEUE KOLLEKTION` — Geist Mono, 10px, versal, 0.3em, Navy 40 %
2. `GOLDEN DAYS,` — Archivo Black, versal, `#1A3040`
3. `Timeless Wear.` — DM Serif Display kursiv, `#D4AF37`
4. Optional unten rechts das Logo aus `assets/instagram/profilbild-marke.png`

---

## Direkt aus dem Terminal

Das Projekt hat bereits ein Gemini-Tool. Prompt A laeuft damit so:

```bash
node tools/nanobanana.mjs \
  --prompt "$(sed -n '/^> Editorial fashion/,/^> Lots of negative space/p' assets/instagram/GEMINI-PROMPT.md | sed 's/^> //')" \
  --in assets/instagram/referenzen/1-logo.png \
  --in assets/instagram/referenzen/2-lichtstimmung.png \
  --in assets/instagram/referenzen/3-strand-lifestyle.webp \
  --in assets/instagram/referenzen/4-produkt-passform.jpg \
  --aspect 4:5 --resolution 2K \
  --out assets/instagram/post-01.png
```

Benoetigt `GEMINI_API_KEY` in `.env.local`.

---

## Bildunterschrift fuer den Post

```
Golden Days, Timeless Wear.

Bademode, die sich wie Ferien anfuehlt — und nicht nach einer
Saison verschwindet. Die neue Kollektion ist da.

Sommer 2026 · Versand aus der Schweiz

#veranoexotico #goldendays #bademode #bikini #swimwear
#sommer2026 #beachwear #schweiz
```
