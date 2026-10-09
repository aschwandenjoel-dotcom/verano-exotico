"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { calcShipping, isShippingCountry, SHIPPING_COUNTRIES } from "@/lib/shipping";
import { CURRENCIES, currencyForCountry, formatPrice } from "@/lib/currency";
import type { Locale } from "@/types";

const PRIORITY_COUNTRIES = ["CH", "LI", "DE", "AT"];
const STORAGE_KEY = "ve_checkout_prefs";

/** Zeitzonen der wichtigsten Lieferländer — der Rest fällt auf die Browsersprache zurück. */
const TIMEZONE_COUNTRY: Record<string, string> = {
  "Europe/Zurich": "CH",
  "Europe/Vaduz": "LI",
  "Europe/Berlin": "DE",
  "Europe/Busingen": "DE",
  "Europe/Vienna": "AT",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Luxembourg": "LU",
  "Europe/London": "GB",
};

/**
 * Vorauswahl fürs Lieferland: zuletzt gewähltes Land, sonst die Region aus der
 * Browsersprache (de-CH → CH), sonst die Schweiz. Die Kundin muss nur noch
 * eingreifen, wenn sie woandershin liefern lässt.
 */
type Prefs = { country: string; currency: string };

function guessPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && isShippingCountry(saved.country) && CURRENCIES.some((c) => c.code === saved.currency)) {
      return saved;
    }
  } catch {
    // Kein Speicher verfügbar — dann eben raten.
  }
  // Zeitzone vor Sprache: Viele in der Schweiz surfen mit "Deutsch (Deutschland)".
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    // ältere Browser — dann zählt die Sprache
  }
  const region = (navigator.languages ?? [navigator.language])
    .map((l) => l.split("-")[1]?.toUpperCase())
    .find((r) => r && isShippingCountry(r));
  const country = TIMEZONE_COUNTRY[zone] ?? region ?? "CH";
  return { country, currency: currencyForCountry(country) };
}

// useSyncExternalStore verlangt einen stabilen Snapshot — einmal raten genügt.
let guessed: Prefs | null = null;
const readGuess = () => (guessed ??= guessPrefs());
const noopSubscribe = () => () => {};
const FALLBACK: Prefs = { country: "CH", currency: "CHF" };

function useCountryOptions(locale: Locale) {
  return useMemo(() => {
    const names = new Intl.DisplayNames([locale === "de" ? "de" : "en"], { type: "region" });
    const withNames = SHIPPING_COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code }));
    const priority = PRIORITY_COUNTRIES.map((code) => withNames.find((c) => c.code === code)!).filter(Boolean);
    const rest = withNames
      .filter((c) => !PRIORITY_COUNTRIES.includes(c.code))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    return [...priority, ...rest];
  }, [locale]);
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  fontFamily: "var(--font-geist-mono)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(26,48,64,0.5)",
  marginBottom: "4px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid rgba(26,48,64,0.15)",
  borderRadius: "8px",
  padding: "9px 10px",
  fontSize: "13px",
  color: "#1A3040",
  cursor: "pointer",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "12px",
  fontFamily: "var(--font-geist-mono)",
  color: "rgba(26,48,64,0.6)",
};

/**
 * Schnellkasse: Lieferland und Währung (beide vorausgewählt), Summe inkl.
 * Versand und ein Knopf direkt zur Stripe-Bezahlseite. Name, Adresse, Telefon
 * und Zahlung erfasst Stripe in einem Schritt — kein eigenes Kassenformular.
 */
export default function ExpressCheckout({ locale, onLeave }: { locale: Locale; onLeave?: () => void }) {
  const t = useTranslations("cart");
  const tc = useTranslations("checkout");
  const router = useRouter();
  const { items, totalPrice } = useCart();
  const countryOptions = useCountryOptions(locale);

  // Erst im Browser raten — auf dem Server gibt es weder Sprache noch Speicher.
  const guess = useSyncExternalStore(noopSubscribe, readGuess, () => FALLBACK);
  const [chosen, setChosen] = useState<Prefs | null>(null);
  const { country, currency } = chosen ?? guess;
  const [newsletter, setNewsletter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function choose(next: Prefs) {
    setChosen(next);
    guessed = next; // Drawer und Kassenseite teilen sich die Wahl
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Nur Komfort — ohne Speicher wird beim nächsten Mal neu geraten.
    }
  }

  function chooseCountry(code: string) {
    // Währung folgt dem Land; wer eine andere will, wählt sie danach.
    choose({ country: code, currency: currencyForCountry(code) });
  }

  function chooseCurrency(code: string) {
    choose({ country, currency: code });
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = calcShipping(country, itemCount);
  const total = Math.round((totalPrice + shipping) * 100) / 100;

  async function pay() {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          express: true,
          locale,
          currency,
          newsletter,
          address: { country },
          items: items.map((i) => ({
            productSlug: i.productSlug,
            quantity: i.quantity,
            size: i.size,
            colorName: i.colorName,
            color: i.color,
            image: i.image,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        // `submitting` bleibt gesetzt — der Knopf ist bis zum Seitenwechsel gesperrt.
        window.location.href = data.url;
        return;
      }
      if (data.error === "use_form") {
        // Vorkasse-Modus: Adresse wird im eigenen Formular erfasst.
        onLeave?.();
        router.push(`/${locale}/checkout`);
        return;
      }
      setError(data.error === "payment_unavailable" ? tc("payment_unavailable") : t("checkout_error"));
    } catch {
      setError(t("checkout_error"));
    }
    setSubmitting(false);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 96px", gap: "10px", marginBottom: "14px" }}>
        <div>
          <label style={labelStyle} htmlFor="express-country">{t("ship_to")}</label>
          <select id="express-country" value={country} onChange={(e) => chooseCountry(e.target.value)} style={selectStyle}>
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="express-currency">{t("currency")}</label>
          <select id="express-currency" value={currency} onChange={(e) => chooseCurrency(e.target.value)} style={selectStyle}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        <div style={rowStyle}>
          <span>{t("subtotal")}</span>
          <span>{formatPrice(totalPrice, currency)}</span>
        </div>
        <div style={rowStyle}>
          <span>{tc("shipping")}</span>
          <span>{formatPrice(shipping, currency)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid rgba(26,48,64,0.12)", paddingTop: "8px", marginTop: "2px" }}>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1A3040" }}>
            {tc("total")}
          </span>
          <span style={{ fontSize: "18px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, color: "#1A3040" }}>
            {formatPrice(total, currency)}
          </span>
        </div>
      </div>

      <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "14px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          style={{ marginTop: "2px", width: "15px", height: "15px", accentColor: "#1A3040", flexShrink: 0 }}
        />
        <span style={{ fontSize: "10px", color: "rgba(26,48,64,0.6)", lineHeight: 1.5 }}>{tc("newsletter_optin")}</span>
      </label>

      {error && <p style={{ fontSize: "12px", color: "#C0392B", margin: "0 0 10px" }}>{error}</p>}

      <button
        type="button"
        onClick={pay}
        disabled={submitting || items.length === 0}
        style={{ width: "100%", padding: "15px", background: "#1A3040", color: "#F8F3E8", border: "none", borderRadius: "9999px", fontSize: "12px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? t("loading") : t("pay_now")}
      </button>

      <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.45)", lineHeight: 1.5, margin: "10px 0 0", textAlign: "center" }}>
        {t("pay_note")}
      </p>
    </div>
  );
}

/**
 * Kassenseite im Stripe-Modus: Ziel des Abbruch-Links von Stripe und direkter
 * Aufruf von /checkout. Zeigt den Warenkorb und dieselbe Schnellkasse.
 */
export function ExpressCheckoutPage({ locale, canceled }: { locale: Locale; canceled: boolean }) {
  const t = useTranslations("checkout");
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: "480px", margin: "80px auto", textAlign: "center" }}>
        <p style={{ fontSize: "14px", color: "rgba(26,48,64,0.5)", fontFamily: "var(--font-geist-mono)", marginBottom: "24px" }}>
          {t("empty")}
        </p>
        <Link
          href={`/${locale}/collection`}
          style={{ display: "inline-block", background: "#1A3040", color: "#F8F3E8", borderRadius: "9999px", padding: "14px 32px", fontSize: "11px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}
        >
          {t("to_shop")}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", marginBottom: "24px" }}>
        {t("title")}
      </h1>

      {canceled && (
        <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#1A3040", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" }}>
          {t("canceled")}
        </p>
      )}

      <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid rgba(26,48,64,0.08)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ position: "relative", width: "52px", height: "52px", flexShrink: 0, borderRadius: "8px", overflow: "hidden", background: "#EDE9E2" }}>
                {item.image && <Image src={item.image} alt={item.name} fill sizes="52px" style={{ objectFit: "contain" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#1A3040", margin: 0, textTransform: "uppercase", lineHeight: 1.3 }}>{item.name}</p>
                <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.45)", margin: "2px 0 0" }}>
                  {item.quantity}× {item.size ? `· ${item.size}` : ""} {item.colorName ? `· ${item.colorName}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
        <ExpressCheckout locale={locale} />
      </div>
    </div>
  );
}
