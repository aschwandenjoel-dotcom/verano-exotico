import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ShopShell from "@/components/ui/ShopShell";
import ClearCartOnSuccess from "@/components/ui/ClearCartOnSuccess";
import { queryOne } from "@/lib/db";
import { renderSwissQrDataUrl } from "@/lib/swissQr";
import type { Locale } from "@/types";

interface OrderRow {
  id: string;
  order_number: number;
  subtotal: number;
  status: string;
  payment_currency?: string | null;
  payment_amount?: number | null;
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const { id } = await searchParams;
  const t = await getTranslations({ locale, namespace: "order" });

  // Bestellung über die (nicht erratbare) UUID laden
  let order: OrderRow | null = null;
  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
    order = await queryOne<OrderRow>(
      "SELECT id, order_number, subtotal, status, payment_currency, payment_amount FROM orders WHERE id = ?",
      [id]
    );
  }

  const iban = process.env.PAYMENT_IBAN || "";
  const holder = process.env.PAYMENT_ACCOUNT_HOLDER || "Joel Aschwanden";

  // QR-Code nur für CHF/EUR möglich (Spezifikation lässt keine anderen Währungen zu)
  const qrCurrency = !order?.payment_currency || order.payment_currency === "CHF" ? "CHF" : order.payment_currency === "EUR" ? "EUR" : null;
  const qrAmount = qrCurrency === "EUR" && order?.payment_amount ? Number(order.payment_amount) : Number(order?.subtotal ?? 0);

  let qrDataUrl: string | null = null;
  if (order && iban && qrCurrency) {
    try {
      qrDataUrl = await renderSwissQrDataUrl({
        iban,
        creditorName: holder,
        creditorStreet: "Gotthardstrasse 59",
        creditorZip: "6460",
        creditorCity: "Altdorf",
        creditorCountry: "CH",
        amount: qrAmount,
        currency: qrCurrency,
        message: `Bestellung VE-${order.order_number}`,
      });
    } catch (err) {
      console.error("QR-Rechnung konnte nicht erzeugt werden:", err);
    }
  }

  const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono)" };

  return (
    <ShopShell locale={locale as Locale}>
      <div
        style={{
          minHeight: "80vh",
          background: "#F8F3E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "110px 24px 80px",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            width: "100%",
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "48px 40px",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(26,48,64,0.08)",
          }}
        >
          <ClearCartOnSuccess />

          {/* Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(46,125,94,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#2E7D5E", marginBottom: "12px" }}>
            {t("received_label")}
          </p>
          <h1 style={{ fontSize: "24px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", marginBottom: "12px", lineHeight: 1.2 }}>
            {t("title")}
          </h1>
          {order && (
            <p style={{ ...mono, fontSize: "12px", color: "rgba(26,48,64,0.45)", marginBottom: "24px" }}>
              {t("order_no")} #{order.order_number}
            </p>
          )}
          <p style={{ fontSize: "14px", color: "rgba(26,48,64,0.55)", lineHeight: 1.7, marginBottom: "28px", fontFamily: "var(--font-syne)" }}>
            {t("body")}
          </p>

          {/* Zahlungsanweisungen */}
          {order && (
            <div style={{ background: "#1A3040", borderRadius: "16px", padding: "24px", textAlign: "left", marginBottom: "28px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "4px" }}>
                {t("payment_title")}
              </p>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(248,243,232,0.5)", marginBottom: "14px" }}>
                {t("payment_option_a")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#F8F3E8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "rgba(248,243,232,0.55)" }}>{t("amount")}</span>
                  <strong>
                    {order.payment_currency && order.payment_currency !== "CHF" && order.payment_amount
                      ? `${order.payment_currency} ${Number(order.payment_amount).toFixed(2)}`
                      : `CHF ${Number(order.subtotal).toFixed(2)}`}
                  </strong>
                </div>
                {order.payment_currency && order.payment_currency !== "CHF" && order.payment_amount && (
                  <p style={{ fontSize: "11px", color: "rgba(248,243,232,0.55)", margin: 0 }}>
                    {t("amount_chf_equivalent", { chf: Number(order.subtotal).toFixed(2) })}
                  </p>
                )}
                {iban ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ color: "rgba(248,243,232,0.55)" }}>{t("iban")}</span>
                    <strong style={mono}>{iban}</strong>
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "rgba(248,243,232,0.7)", margin: 0 }}>{t("iban_missing")}</p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "rgba(248,243,232,0.55)" }}>{t("holder")}</span>
                  <strong>{holder}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "rgba(248,243,232,0.55)" }}>{t("reference")}</span>
                  <strong style={mono}>VE-{order.order_number}</strong>
                </div>
              </div>
              <p style={{ fontSize: "11px", color: "rgba(248,243,232,0.6)", lineHeight: 1.6, margin: "14px 0 0" }}>
                {t("reference_note")}
              </p>

              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(248,243,232,0.15)", textAlign: qrDataUrl ? "center" : "left" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(248,243,232,0.5)", marginBottom: "10px", textAlign: "left" }}>
                  {t("payment_option_b")}
                </p>
                {qrDataUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} width={160} height={160} alt="QR-Code für Zahlung" style={{ display: "inline-block", background: "#FFFFFF", borderRadius: "8px", padding: "8px" }} />
                    <p style={{ fontSize: "11px", color: "rgba(248,243,232,0.6)", lineHeight: 1.6, margin: "10px 0 0" }}>
                      {t("qr_hint", { amount: `${qrCurrency} ${qrAmount.toFixed(2)}` })}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "11px", color: "rgba(248,243,232,0.55)", lineHeight: 1.6, margin: 0 }}>
                    {t("qr_unavailable")}
                  </p>
                )}
              </div>
            </div>
          )}

          <p style={{ fontSize: "12px", color: "rgba(26,48,64,0.5)", lineHeight: 1.7, marginBottom: "32px" }}>
            {t("pending_note")}<br />
            {t("email_sent")}
          </p>

          <Link
            href={`/${locale}/collection`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#1A3040",
              color: "#F8F3E8",
              borderRadius: "9999px",
              padding: "14px 32px",
              fontSize: "11px",
              fontFamily: "var(--font-archivo-black),sans-serif",
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            {t("continue")}
          </Link>
        </div>
      </div>
    </ShopShell>
  );
}
