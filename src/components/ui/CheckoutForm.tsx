"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { calcShipping, SHIPPING_COUNTRIES, type ShippingCountry } from "@/lib/shipping";
import type { Ort } from "@/app/api/orte/route";
import { CURRENCIES, formatPrice } from "@/lib/currency";
import type { Locale } from "@/types";

/** Bevorzugte Länder oben in der Auswahl, Rest alphabetisch danach. */
const PRIORITY_COUNTRIES = ["CH", "LI", "DE", "AT"];

function useCountryOptions(locale: Locale) {
  return useMemo(() => {
    const names = new Intl.DisplayNames([locale === "de" ? "de" : "en"], { type: "region" });
    const withNames = SHIPPING_COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code }));
    const priority = PRIORITY_COUNTRIES
      .map((code) => withNames.find((c) => c.code === code))
      .filter((c): c is { code: string; name: string } => !!c);
    const rest = withNames
      .filter((c) => !PRIORITY_COUNTRIES.includes(c.code))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    return [...priority, ...rest];
  }, [locale]);
}

function countryName(locale: Locale, code: string): string {
  return new Intl.DisplayNames([locale === "de" ? "de" : "en"], { type: "region" }).of(code) ?? code;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid rgba(26,48,64,0.15)",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  color: "#1A3040",
  outline: "none",
  boxSizing: "border-box",
};

/** Rot umrandetes Feld, sobald die Eingabe beim Absenden fehlt oder ungültig ist. */
const invalidStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: "#B4553C",
  background: "#FDF5F3",
};

type FeldName = "name" | "email" | "phone" | "line1" | "postal" | "city" | "country" | "currency";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontFamily: "var(--font-geist-mono)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(26,48,64,0.5)",
  marginBottom: "6px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "12px",
  fontFamily: "var(--font-archivo-black), sans-serif",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#1A3040",
  margin: "0 0 16px",
};

export default function CheckoutForm({
  locale,
  paymentMode = "prepay",
  canceled = false,
}: {
  locale: Locale;
  /** Aus der Server-Komponente durchgereicht (src/lib/stripe.ts) — bestimmt die Texte im Zahlungsblock. */
  paymentMode?: "stripe" | "prepay";
  /** Kundin ist von der Stripe-Bezahlseite über "Abbrechen" zurückgekommen. */
  canceled?: boolean;
}) {
  const isCard = paymentMode === "stripe";
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, totalPrice } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [postal, setPostal] = useState("");
  const [city, setCity] = useState("");
  // Land und Zahlungswährung starten bewusst leer — die Kundin soll beides
  // aktiv wählen, statt eine Vorgabe zu übersehen.
  const [country, setCountry] = useState<ShippingCountry>("");
  const [payCurrency, setPayCurrency] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Wird erst beim Absenden gefüllt — nicht schon beim Tippen, sonst wird die
  // Kundin gerügt, bevor sie das Feld überhaupt fertig ausgefüllt hat.
  const [fehler, setFehler] = useState<Partial<Record<FeldName, boolean>>>({});
  const countryOptions = useCountryOptions(locale);

  // Ortsvorschläge: echte PLZ-Ort-Kombinationen aus /api/orte. Ein Klick füllt
  // PLZ, Ort und Land in einem Zug — das ist die häufigste Fehlerquelle beim
  // Adresseintippen und zugleich das, was CJ für die Zustellung braucht.
  const [vorschlaege, setVorschlaege] = useState<Ort[]>([]);
  const [vorschlaegeOffen, setVorschlaegeOffen] = useState(false);
  const [aktiver, setAktiver] = useState(-1);
  const anfrageNr = useRef(0);
  const ortGewaehlt = useRef(false);

  useEffect(() => {
    // Nach einem Klick auf einen Vorschlag nicht sofort wieder suchen.
    if (ortGewaehlt.current) {
      ortGewaehlt.current = false;
      return;
    }
    if (city.trim().length < 2) {
      setVorschlaege([]);
      return;
    }
    const nr = ++anfrageNr.current;
    const timer = setTimeout(async () => {
      try {
        const url = `/api/orte?q=${encodeURIComponent(city.trim())}${country ? `&land=${country}` : ""}`;
        const res = await fetch(url);
        const daten: Ort[] = res.ok ? await res.json() : [];
        // Nur die Antwort auf die zuletzt gestellte Frage anzeigen
        if (nr === anfrageNr.current) {
          setVorschlaege(daten);
          setVorschlaegeOffen(daten.length > 0);
          setAktiver(-1);
        }
      } catch {
        // Ohne Vorschläge bleibt das Formular normal von Hand ausfüllbar
        if (nr === anfrageNr.current) setVorschlaege([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [city, country]);

  function vorschlagUebernehmen(o: Ort) {
    ortGewaehlt.current = true;
    setCity(o.ort);
    setPostal(o.plz);
    setCountry(o.land as ShippingCountry);
    setVorschlaege([]);
    setVorschlaegeOffen(false);
    setAktiver(-1);
    setFehler((p) => ({ ...p, city: false, postal: false, country: false }));
  }

  /** Dieselben Regeln wie serverseitig in /api/checkout — sonst rot hier, 400 dort. */
  function pruefe(): Partial<Record<FeldName, boolean>> {
    return {
      name: name.trim().length < 2,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()),
      phone: phone.replace(/\D/g, "").length < 7,
      line1: !line1.trim(),
      postal: !postal.trim(),
      city: !city.trim(),
      country: !country,
      currency: !payCurrency,
    };
  }

  /** Markierung eines Feldes aufheben, sobald daran weitergeschrieben wird. */
  function feldStil(feld: FeldName): React.CSSProperties {
    return fehler[feld] ? invalidStyle : inputStyle;
  }
  function beiEingabe(feld: FeldName, setzen: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setzen(e.target.value);
      if (fehler[feld]) setFehler((p) => ({ ...p, [feld]: false }));
    };
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  // Ohne Zielland sind die Versandkosten unbekannt. calcShipping() würde 0
  // liefern und damit eine zu niedrige Gesamtsumme anzeigen — deshalb null
  // und in der Übersicht ein Platzhalter statt einer falschen Zahl.
  const shipping = country ? calcShipping(country, itemCount) : null;
  const total = shipping === null ? null : Math.round((totalPrice + shipping) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const springeZu = (id: string) => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    };

    const gefunden = pruefe();
    if (Object.values(gefunden).some(Boolean)) {
      setFehler(gefunden);
      setError(t("incomplete"));
      // Zum ersten beanstandeten Feld springen, damit es auf dem Handy
      // nicht ausserhalb des Sichtbereichs rot wird.
      const reihenfolge: FeldName[] = ["name", "email", "phone", "line1", "postal", "city", "country", "currency"];
      const erstes = reihenfolge.find((f) => gefunden[f]);
      if (erstes) springeZu(`feld-${erstes}`);
      return;
    }

    setFehler({});
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          currency: payCurrency,
          customer: { name, email, phone },
          address: { line1, line2, postal_code: postal, city, country },
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
        // Stripe-Modus: weiter zur gehosteten Bezahlseite. `submitting` bleibt
        // absichtlich gesetzt — der Knopf soll bis zum Seitenwechsel gesperrt sein.
        window.location.href = data.url;
      } else if (res.ok && data.orderId) {
        router.push(`/${locale}/order-confirmation?id=${data.orderId}`);
      } else if (data.error === "payment_unavailable") {
        setError(t("payment_unavailable"));
        setSubmitting(false);
      } else {
        // Feldbezogene Ablehnungen des Servers ebenfalls rot markieren, statt
        // nur eine allgemeine Meldung zu zeigen.
        const zuFeld: Record<string, FeldName[]> = {
          name: ["name"],
          email: ["email"],
          phone: ["phone"],
          address: ["line1", "postal", "city"],
          country: ["country"],
          currency: ["currency"],
        };
        const felder = zuFeld[String(data.error)];
        if (felder) {
          setFehler(Object.fromEntries(felder.map((f) => [f, true])));
          setError(t("incomplete"));
        } else {
          setError(t("error"));
        }
        setSubmitting(false);
      }
    } catch {
      setError(t("error"));
      setSubmitting(false);
    }
  }

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
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", marginBottom: "32px" }}>
        {t("title")}
      </h1>

      {/* Rückkehr von der Stripe-Bezahlseite ohne Zahlung */}
      {canceled && (
        <p style={{
          fontSize: "13px",
          lineHeight: 1.6,
          color: "#1A3040",
          background: "rgba(212,175,55,0.12)",
          border: "1px solid rgba(212,175,55,0.4)",
          borderRadius: "12px",
          padding: "14px 18px",
          marginBottom: "24px",
        }}>
          {t("canceled")}
        </p>
      )}

      {/* noValidate: die Browser-Sprechblasen würden unsere eigene, rote
          Markierung verhindern — geprüft wird stattdessen in pruefe(). */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* ── Formular ── */}
          <div className="lg:col-span-3" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", border: "1px solid rgba(26,48,64,0.08)" }}>
              <h2 style={sectionTitle}>{t("contact")}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle} htmlFor="feld-name">{t("name")}</label>
                  <input id="feld-name" required aria-invalid={!!fehler.name} value={name} onChange={beiEingabe("name", setName)} style={feldStil("name")} autoComplete="name" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle} htmlFor="feld-email">{t("email")}</label>
                    <input id="feld-email" required type="email" aria-invalid={!!fehler.email} value={email} onChange={beiEingabe("email", setEmail)} style={feldStil("email")} autoComplete="email" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="feld-phone">{t("phone")}</label>
                    <input id="feld-phone" required type="tel" aria-invalid={!!fehler.phone} value={phone} onChange={beiEingabe("phone", setPhone)} style={feldStil("phone")} autoComplete="tel" placeholder="+41 79 …" />
                    <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", marginTop: "4px" }}>{t("phone_hint")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", border: "1px solid rgba(26,48,64,0.08)" }}>
              <h2 style={sectionTitle}>{t("address")}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle} htmlFor="feld-line1">{t("line1")}</label>
                  <input id="feld-line1" required aria-invalid={!!fehler.line1} value={line1} onChange={beiEingabe("line1", setLine1)} style={feldStil("line1")} autoComplete="address-line1" />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="feld-line2">{t("line2")}</label>
                  <input id="feld-line2" value={line2} onChange={(e) => setLine2(e.target.value)} style={inputStyle} autoComplete="address-line2" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle} htmlFor="feld-postal">{t("postal")}</label>
                    <input id="feld-postal" required aria-invalid={!!fehler.postal} value={postal} onChange={beiEingabe("postal", setPostal)} style={feldStil("postal")} autoComplete="postal-code" />
                  </div>
                  <div className="sm:col-span-2" style={{ position: "relative" }}>
                    <label style={labelStyle} htmlFor="feld-city">{t("city")}</label>
                    <input
                      id="feld-city"
                      required
                      aria-invalid={!!fehler.city}
                      value={city}
                      onChange={beiEingabe("city", setCity)}
                      onFocus={() => setVorschlaegeOffen(vorschlaege.length > 0)}
                      // Kurz warten, sonst schliesst der Fokusverlust die Liste,
                      // bevor der Klick auf einen Vorschlag ankommt.
                      onBlur={() => setTimeout(() => setVorschlaegeOffen(false), 150)}
                      onKeyDown={(e) => {
                        if (!vorschlaegeOffen || vorschlaege.length === 0) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setAktiver((i) => (i + 1) % vorschlaege.length);
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setAktiver((i) => (i <= 0 ? vorschlaege.length - 1 : i - 1));
                        } else if (e.key === "Enter" && aktiver >= 0) {
                          e.preventDefault();
                          vorschlagUebernehmen(vorschlaege[aktiver]);
                        } else if (e.key === "Escape") {
                          setVorschlaegeOffen(false);
                        }
                      }}
                      style={feldStil("city")}
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={vorschlaegeOffen}
                      aria-autocomplete="list"
                    />
                    {vorschlaegeOffen && vorschlaege.length > 0 && (
                      <ul
                        role="listbox"
                        style={{
                          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                          margin: "4px 0 0", padding: 0, listStyle: "none",
                          background: "#FFFFFF", border: "1px solid rgba(26,48,64,0.15)",
                          borderRadius: "8px", boxShadow: "0 8px 24px rgba(26,48,64,0.12)",
                          overflow: "hidden",
                        }}
                      >
                        {vorschlaege.map((o, i) => (
                          <li
                            key={`${o.land}-${o.plz}-${o.ort}`}
                            role="option"
                            aria-selected={i === aktiver}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => vorschlagUebernehmen(o)}
                            onMouseEnter={() => setAktiver(i)}
                            style={{
                              padding: "10px 14px", cursor: "pointer", fontSize: "13px",
                              display: "flex", justifyContent: "space-between", gap: "10px",
                              background: i === aktiver ? "rgba(0,180,197,0.10)" : "transparent",
                            }}
                          >
                            <span style={{ color: "#1A3040" }}>
                              <strong style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600 }}>{o.plz}</strong>{" "}
                              {o.ort}
                            </span>
                            <span style={{ color: "rgba(26,48,64,0.45)", fontSize: "11px", whiteSpace: "nowrap" }}>
                              {countryName(locale, o.land)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", marginTop: "4px" }}>
                      {t("city_hint")}
                    </p>
                  </div>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="feld-country">{t("country")}</label>
                  <select
                    id="feld-country"
                    value={country}
                    aria-invalid={!!fehler.country}
                    onChange={(e) => {
                      setCountry(e.target.value as ShippingCountry);
                      if (fehler.country) setFehler((p) => ({ ...p, country: false }));
                    }}
                    style={{ ...feldStil("country"), cursor: "pointer" }}
                  >
                    <option value="" disabled>{t("choose")}</option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="feld-currency">{t("pay_currency")}</label>
                  <select
                    id="feld-currency"
                    value={payCurrency}
                    aria-invalid={!!fehler.currency}
                    onChange={(e) => {
                      setPayCurrency(e.target.value);
                      if (fehler.currency) setFehler((p) => ({ ...p, currency: false }));
                    }}
                    style={{ ...feldStil("currency"), cursor: "pointer" }}
                  >
                    <option value="" disabled>{t("choose")}</option>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", marginTop: "4px" }}>{t("pay_currency_hint")}</p>
                </div>
              </div>
            </div>

            <div style={{ background: "#1A3040", borderRadius: "16px", padding: "28px" }}>
              <h2 style={{ ...sectionTitle, color: "#D4AF37" }}>{t(isCard ? "payment_title_card" : "payment_title")}</h2>
              <p style={{ fontSize: "13px", color: "rgba(248,243,232,0.75)", lineHeight: 1.7, margin: 0 }}>
                {t(isCard ? "payment_info_card" : "payment_info")}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(248,243,232,0.15)" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(248,243,232,0.55)" }}>
                  {t(isCard ? "amount_to_pay" : "amount_to_transfer")}
                </span>
                <span style={{ fontSize: "22px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, color: "#D4AF37" }}>
                  {total === null ? "—" : formatPrice(total, payCurrency)}
                </span>
              </div>
              {total !== null && payCurrency && payCurrency !== "CHF" && (
                <p style={{ fontSize: "11px", color: "rgba(248,243,232,0.55)", lineHeight: 1.6, margin: "10px 0 0" }}>
                  {t(isCard ? "pay_currency_note_card" : "pay_currency_note", { chf: total.toFixed(2) })}
                </p>
              )}
            </div>
          </div>

          {/* ── Bestellübersicht ── */}
          <div className="lg:col-span-2" style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", border: "1px solid rgba(26,48,64,0.08)", position: "sticky", top: "90px" }}>
            <h2 style={sectionTitle}>{t("summary")}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
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
                  <span style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", color: "#1A3040", fontWeight: 700 }}>
                    {formatPrice(item.price * item.quantity, payCurrency)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(26,48,64,0.1)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.6)" }}>
                <span>{t("subtotal")}</span>
                <span>{formatPrice(totalPrice, payCurrency)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.6)" }}>
                <span>{t("shipping")}{country ? ` · ${countryName(locale, country)}` : ""}</span>
                <span>{shipping === null ? "—" : formatPrice(shipping, payCurrency)}</span>
              </div>
              <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", margin: 0 }}>
                {shipping === null ? t("shipping_pending") : t("shipping_hint")}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "2px solid #1A3040", paddingTop: "12px", marginTop: "6px" }}>
                <span style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1A3040" }}>{t("total")}</span>
                <span style={{ fontSize: "20px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, color: "#1A3040" }}>{total === null ? "—" : formatPrice(total, payCurrency)}</span>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "14px" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ width: "100%", marginTop: "18px", padding: "16px", background: "#1A3040", color: "#F8F3E8", border: "none", borderRadius: "9999px", fontSize: "12px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? t("submitting") : t("submit")}
            </button>

            <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.45)", lineHeight: 1.6, marginTop: "12px", textAlign: "center" }}>
              {t.rich("legal_note", {
                agb: (chunks) => (
                  <Link href={`/${locale}/agb`} style={{ color: "#1A3040", textDecoration: "underline" }}>{chunks}</Link>
                ),
                widerruf: (chunks) => (
                  <Link href={`/${locale}/widerruf`} style={{ color: "#1A3040", textDecoration: "underline" }}>{chunks}</Link>
                ),
              })}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
