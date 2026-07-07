"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { calcShipping, SHIPPING_COUNTRIES, type ShippingCountry } from "@/lib/shipping";
import { CURRENCIES, DEFAULT_CURRENCY, formatPrice } from "@/lib/currency";
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

export default function CheckoutForm({ locale }: { locale: Locale }) {
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
  const [country, setCountry] = useState<ShippingCountry>("CH");
  const [payCurrency, setPayCurrency] = useState(DEFAULT_CURRENCY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const countryOptions = useCountryOptions(locale);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = calcShipping(country, itemCount);
  const total = Math.round((totalPrice + shipping) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
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
      if (res.ok && data.orderId) {
        router.push(`/${locale}/order-confirmation?id=${data.orderId}`);
      } else {
        setError(t("error"));
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* ── Formular ── */}
          <div className="lg:col-span-3" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", border: "1px solid rgba(26,48,64,0.08)" }}>
              <h2 style={sectionTitle}>{t("contact")}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>{t("name")}</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoComplete="name" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>{t("email")}</label>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("phone")}</label>
                    <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} autoComplete="tel" placeholder="+41 79 …" />
                    <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", marginTop: "4px" }}>{t("phone_hint")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", border: "1px solid rgba(26,48,64,0.08)" }}>
              <h2 style={sectionTitle}>{t("address")}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>{t("line1")}</label>
                  <input required value={line1} onChange={(e) => setLine1(e.target.value)} style={inputStyle} autoComplete="address-line1" />
                </div>
                <div>
                  <label style={labelStyle}>{t("line2")}</label>
                  <input value={line2} onChange={(e) => setLine2(e.target.value)} style={inputStyle} autoComplete="address-line2" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>{t("postal")}</label>
                    <input required value={postal} onChange={(e) => setPostal(e.target.value)} style={inputStyle} autoComplete="postal-code" />
                  </div>
                  <div className="sm:col-span-2">
                    <label style={labelStyle}>{t("city")}</label>
                    <input required value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} autoComplete="address-level2" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t("country")}</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value as ShippingCountry)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("pay_currency")}</label>
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", marginTop: "4px" }}>{t("pay_currency_hint")}</p>
                </div>
              </div>
            </div>

            <div style={{ background: "#1A3040", borderRadius: "16px", padding: "28px" }}>
              <h2 style={{ ...sectionTitle, color: "#D4AF37" }}>{t("payment_title")}</h2>
              <p style={{ fontSize: "13px", color: "rgba(248,243,232,0.75)", lineHeight: 1.7, margin: 0 }}>
                {t("payment_info")}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(248,243,232,0.15)" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(248,243,232,0.55)" }}>
                  {t("amount_to_transfer")}
                </span>
                <span style={{ fontSize: "22px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, color: "#D4AF37" }}>
                  {formatPrice(total, payCurrency)}
                </span>
              </div>
              {payCurrency !== "CHF" && (
                <p style={{ fontSize: "11px", color: "rgba(248,243,232,0.55)", lineHeight: 1.6, margin: "10px 0 0" }}>
                  {t("pay_currency_note", { chf: total.toFixed(2) })}
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
                <span>{t("shipping")} · {countryName(locale, country)}</span>
                <span>{formatPrice(shipping, payCurrency)}</span>
              </div>
              <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.4)", margin: 0 }}>{t("shipping_hint")}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "2px solid #1A3040", paddingTop: "12px", marginTop: "6px" }}>
                <span style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1A3040" }}>{t("total")}</span>
                <span style={{ fontSize: "20px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, color: "#1A3040" }}>{formatPrice(total, payCurrency)}</span>
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
