"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import voicesData from "@/data/customer-voices.json";
import type { Locale } from "@/types";

/**
 * Echte Käuferkommentare, einer nach dem anderen.
 *
 * Quelle: die Kommentare, die bei CJdropshipping an genau diesen Modellen
 * hängen — eingesammelt von tools/cj-reviews.mjs nach
 * src/data/customer-voices.json. Originaltexte, nur ausgewählt (Sterne,
 * Sprache, Länge), nicht umgeschrieben und nicht übersetzt.
 *
 * Wichtig: Das sind NICHT Bewertungen aus Bestellungen in diesem Shop. Die
 * stehen unter dem jeweiligen Produkt (ReviewSection, echte Kundinnen mit
 * „Verifizierter Kauf"). Die Herkunft wird darum unter der Sektion benannt —
 * fremde Stimmen als eigene auszugeben wäre irreführende Werbung (UWG Art. 3).
 *
 * Ist die Datei leer (Import noch nicht gelaufen), rendert die Sektion nichts.
 * Lieber keine Sektion als eine mit Platzhaltern.
 */

interface Voice {
  id: string;
  slug: string;
  product: { de: string; en: string };
  rating: number;
  comment: string;
  lang: string;
  author: string;
  country: string | null;
  date: string | null;
}

const ALL_VOICES = voicesData.voices as unknown as Voice[];

const ROTATE_MS = 7000;

// „Bewegung reduzieren" in den Systemeinstellungen. Über useSyncExternalStore
// statt useEffect+setState: kein zweiter Render nach dem Mount, und der Server
// rendert immer denselben Wert (false), also keine Hydrations-Abweichung.
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * "CH" → 🇨🇭 (Regional-Indicator-Buchstaben) — keine fremden Bilddateien nötig.
 *
 * CJ liefert vereinzelt Codes, die nicht ISO-3166 sind: "UK" statt "GB", "EL"
 * statt "GR". Daraus entsteht kein Flaggen-Emoji, sondern zwei Buchstaben in
 * Kästchen. Deshalb die Umschreibung.
 */
const COUNTRY_ALIASES: Record<string, string> = { UK: "GB", EL: "GR" };

function flag(country: string | null): string {
  if (!country || !/^[A-Z]{2}$/.test(country)) return "";
  const code = COUNTRY_ALIASES[country] ?? country;
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-hidden="true" style={{ color: "#D4AF37", fontSize: "15px", letterSpacing: "2px" }}>
      {"★".repeat(Math.max(1, Math.min(5, value)))}
      <span style={{ color: "rgba(26,48,64,0.18)" }}>{"★".repeat(5 - Math.max(1, Math.min(5, value)))}</span>
    </span>
  );
}

/**
 * Eine Kommentarbox fürs Laufband. `copy` markiert die zweite Hälfte der
 * Spur: optisch die Fortsetzung, für Screenreader und Tastatur unsichtbar,
 * damit jeder Kommentar nur einmal vorgelesen wird.
 */
function VoiceCard({ voice, locale, copy = false }: { voice: Voice; locale: Locale; copy?: boolean }) {
  return (
    <figure className="voice-card" aria-hidden={copy || undefined} inert={copy || undefined}>
      <Stars value={voice.rating} />
      <blockquote
        style={{
          margin: "14px 0 0",
          fontFamily: "var(--font-dm-serif)",
          fontStyle: "italic",
          fontSize: "17px",
          lineHeight: 1.5,
          color: "#1A3040",
        }}
      >
        «{voice.comment}»
      </blockquote>
      <figcaption
        style={{
          marginTop: "auto",
          paddingTop: "18px",
          fontSize: "11px",
          fontFamily: "var(--font-geist-mono)",
          letterSpacing: "0.06em",
          color: "rgba(26,48,64,0.5)",
        }}
      >
        {flag(voice.country) && <span aria-hidden="true">{flag(voice.country)} </span>}
        {voice.author}
        {" · "}
        <Link
          href={`/${locale}/product/${voice.slug}`}
          style={{ color: "rgba(26,48,64,0.75)", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          {locale === "de" ? voice.product.de : voice.product.en}
        </Link>
      </figcaption>
    </figure>
  );
}

export default function CustomerVoices({
  locale,
  slug,
  limit = 24,
  variant = "rotator",
}: {
  locale: Locale;
  /** Nur Kommentare zu diesem Produkt zeigen. Ohne Angabe: alle Produkte. */
  slug?: string;
  limit?: number;
  /**
   * "rotator" — eine Stimme nach der anderen, eingeblendet (Produktseiten).
   * "marquee" — Kommentarboxen laufen endlos durchs Bild (Startseite).
   */
  variant?: "rotator" | "marquee";
}) {
  const t = useTranslations("voices");

  const voices = useMemo(
    () => (slug ? ALL_VOICES.filter((v) => v.slug === slug) : ALL_VOICES).slice(0, limit),
    [slug, limit]
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const calm = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  );

  // Weiterschalten: nicht bei reduzierter Bewegung, nicht wenn die Maus/der
  // Fokus draufliegt (sonst verschwindet der Text beim Lesen).
  useEffect(() => {
    if (calm || paused || voices.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % voices.length), ROTATE_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [calm, paused, voices.length]);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + voices.length) % voices.length),
    [voices.length]
  );

  if (voices.length === 0) return null;

  if (variant === "marquee") {
    // Die Spur enthält die Karten zweimal — die zweite Hälfte ist nur die
    // optische Fortsetzung und für Screenreader unsichtbar. Tempo nach Anzahl,
    // damit zehn Karten nicht schneller durchrauschen als drei.
    const seconds = Math.max(20, voices.length * 5);
    return (
      <section
        className="py-20"
        style={{ borderBottom: "1px solid rgba(26,48,64,0.1)" }}
        aria-label={t("title")}
      >
        <div className="px-6 md:px-10 reveal">
          <p
            className="text-[10px] tracking-[0.35em] uppercase mb-2 text-center"
            style={{ color: "#00B4C5", fontFamily: "var(--font-geist-mono)" }}
          >
            {t("label")}
          </p>
          <h2
            className="font-black uppercase text-2xl md:text-3xl text-center mb-12"
            style={{ fontFamily: "var(--font-archivo-black), sans-serif", color: "#1A3040" }}
          >
            {t("title")}
          </h2>
        </div>

        <div className="voice-marquee">
          <div className="voice-marquee-track" style={{ animationDuration: `${seconds}s` }}>
            {voices.map((voice) => (
              <VoiceCard key={voice.id} voice={voice} locale={locale} />
            ))}
            {voices.map((voice) => (
              <VoiceCard key={`copy-${voice.id}`} voice={voice} locale={locale} copy />
            ))}
          </div>
        </div>

        <p
          className="text-center text-[10px] leading-relaxed px-6"
          style={{ fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.38)", maxWidth: "620px", margin: "36px auto 0" }}
        >
          {t("source_note")}
        </p>
      </section>
    );
  }

  const v = voices[Math.min(index, voices.length - 1)];
  const productName = locale === "de" ? v.product.de : v.product.en;
  // Das Datum steht bewusst nicht in der Anzeige: Die Kommentare stammen
  // grösstenteils aus 2020 und wirken mit Datum wie Ladenhüter. Es bleibt in
  // customer-voices.json erhalten — erfunden wird keines.

  return (
    <section
      className="px-6 md:px-10 py-20"
      style={{ borderBottom: "1px solid rgba(26,48,64,0.1)" }}
      aria-label={t("title")}
    >
      <div className="max-w-4xl mx-auto reveal">
        <p
          className="text-[10px] tracking-[0.35em] uppercase mb-2 text-center"
          style={{ color: "#00B4C5", fontFamily: "var(--font-geist-mono)" }}
        >
          {t("label")}
        </p>
        <h2
          className="font-black uppercase text-2xl md:text-3xl text-center mb-10"
          style={{ fontFamily: "var(--font-archivo-black), sans-serif", color: "#1A3040" }}
        >
          {t("title")}
        </h2>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {voices.length > 1 && (
            <button
              type="button"
              aria-label={t("aria_prev")}
              onClick={() => go(-1)}
              style={arrowStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#1A3040"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(26,48,64,0.35)"; }}
            >
              ‹
            </button>
          )}

          {/* Eine Stimme, dann die nächste. Der key erzwingt das Einblenden. */}
          <div
            style={{
              flex: 1,
              minHeight: "190px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {/* key über den Index, nicht über die ID: Er muss bei jedem Wechsel
                anders sein, damit die Einblend-Animation neu startet. */}
            <div key={index} className={calm ? undefined : "voice-in"} style={{ width: "100%" }}>
              <Stars value={v.rating} />
              <blockquote
                style={{
                  margin: "16px 0 0",
                  fontFamily: "var(--font-dm-serif)",
                  fontStyle: "italic",
                  fontSize: "clamp(1.05rem, 2.4vw, 1.5rem)",
                  lineHeight: 1.5,
                  color: "#1A3040",
                }}
              >
                «{v.comment}»
              </blockquote>
              <p
                className="mt-5 text-[11px]"
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  letterSpacing: "0.08em",
                  color: "rgba(26,48,64,0.5)",
                }}
              >
                {flag(v.country) && <span aria-hidden="true">{flag(v.country)} </span>}
                {v.author}
                {" · "}
                <Link
                  href={`/${locale}/product/${v.slug}`}
                  style={{ color: "rgba(26,48,64,0.75)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                >
                  {productName}
                </Link>
              </p>
            </div>
          </div>

          {voices.length > 1 && (
            <button
              type="button"
              aria-label={t("aria_next")}
              onClick={() => go(1)}
              style={arrowStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#1A3040"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(26,48,64,0.35)"; }}
            >
              ›
            </button>
          )}
        </div>

        {/* Position in der Reihe — höchstens 12 Punkte, sonst wird es eine Perlenkette */}
        {voices.length > 1 && voices.length <= 12 && (
          <div className="flex justify-center gap-2 mt-6">
            {voices.map((voice, i) => (
              <button
                key={`${voice.id}-${i}`}
                type="button"
                aria-label={`${i + 1} / ${voices.length}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? "20px" : "7px",
                  height: "7px",
                  borderRadius: "9999px",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background: i === index ? "#D4AF37" : "rgba(26,48,64,0.2)",
                  transition: "width .25s ease, background .25s ease",
                }}
              />
            ))}
          </div>
        )}
        {voices.length > 12 && (
          <p
            className="text-center mt-6 text-[10px]"
            style={{ fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.35)" }}
          >
            {index + 1} / {voices.length}
          </p>
        )}

        {/* Herkunft der Kommentare. Bewusst knapp und leise gesetzt — aber
            lesbar und immer da. Sie ganz zu verstecken wäre irreführende
            Werbung (UWG Art. 3 Abs. 1 lit. b, EU-Richtlinie 2005/29 Anh. I
            Nr. 23b) und verstösst gegen die Richtlinien des Merchant Center,
            über das der Shop seinen Produktfeed ausliefert. */}
        <p
          className="text-center text-[10px] leading-relaxed"
          style={{ fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.38)", maxWidth: "620px", margin: "28px auto 0" }}
        >
          {t("source_note")}
        </p>
      </div>
    </section>
  );
}

const arrowStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "8px",
  fontSize: "26px",
  lineHeight: 1,
  cursor: "pointer",
  color: "rgba(26,48,64,0.35)",
  transition: "color .2s",
  flexShrink: 0,
};
