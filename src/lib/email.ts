import { Resend } from "resend";
import { renderSwissQrPng, type SwissQrCurrency } from "@/lib/swissQr";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

/**
 * Apple Mail / iOS Mail invertieren im Dark Mode die Farben von Mails, die kein
 * Farbschema deklarieren — der dunkle Header wird dann hell und unleserlich.
 * "light" erzwingt die gestaltete Darstellung. Gmail ignoriert das und färbt
 * weiterhin selbst um; dagegen hilft nur ein von Grund auf dunkles Template.
 */
const EMAIL_HEAD = `<meta charset="utf-8">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>:root { color-scheme: light; supported-color-schemes: light; }</style>`;
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "veranoexotico@gmail.com";

export type EmailLocale = "de" | "en";

/** Alle Texte für Transaktionsmails, je Sprache — die Mail kommt immer in der Sprache, in der die Kundin die Website eingestellt hatte. */
const T = {
  de: {
    footerTagline: "Bademode für endlose Sommer",
    orderReceivedTitle: "Bestellung eingegangen",
    greeting: (name: string) => `Hallo ${name}!`,
    intro: "Danke für deine Bestellung. Bitte überweise den Betrag — sobald deine Zahlung eingeht, geht dein Paket auf die Reise.",
    orderLabel: (n: number) => `Bestellung #${n}`,
    size: "Grösse",
    color: "Farbe",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    discount: "Rabatt",
    total: "Total",
    payTitle: "So bezahlst du — 2 Möglichkeiten",
    optionA: "Option A · Manuelle Überweisung (jede Währung)",
    amountLabel: "Betrag",
    ibanLabel: "IBAN",
    holderLabel: "Empfänger",
    refLabel: "Zahlungsreferenz / Mitteilung",
    foreignNote: (chf: string) =>
      `Entspricht CHF ${chf} zum aktuellen Kurs. Der Betrag kann bei Zahlungseingang leicht abweichen, je nach Umrechnungskurs deiner Bank — das ist normal.`,
    refNote: (ref: string) =>
      `Bitte gib unbedingt die Referenz ${ref} an, damit wir deine Zahlung zuordnen können. Sobald die Zahlung bei uns eingeht, machen wir deine Bestellung versandbereit.`,
    optionB: "Option B · QR-Code scannen (nur bei CHF oder EUR)",
    qrHint: (amount: string) =>
      `Scanne den QR-Code mit deiner Banking-App (z. B. Neon, PostFinance, …) — IBAN, Empfänger und Betrag ${amount} werden automatisch ausgefüllt. Die Referenz musst du ggf. noch manuell ins Mitteilungsfeld eintragen.`,
    qrUnavailable:
      "Für deine gewählte Zahlungswährung gibt es keinen QR-Code (nur bei CHF oder EUR möglich) — bitte nutze die manuelle Überweisung oben.",
    deliveryNote: "Lieferzeit: 5–14 Werktage nach Zahlungseingang.",
    shippingMailNote: "Du erhältst eine weitere E-Mail mit Sendungsnummer, sobald deine Bestellung versandt wurde.",
    addressLabel: "Lieferadresse",
    subjectPay: (n: number, amt: string) => `Bestellung #${n} — bitte Zahlung abschliessen (${amt})`,
    paidTitle: "Bestellung bestätigt",
    paidIntro: "Danke für deine Bestellung — deine Zahlung ist eingegangen. Wir machen dein Paket versandbereit.",
    paidBoxTitle: "Zahlung erhalten",
    paidBoxNote: "Du bekommst eine weitere E-Mail mit Sendungsnummer, sobald dein Paket unterwegs ist.",
    paidDeliveryNote: "Lieferzeit: 5–14 Werktage.",
    subjectPaid: (n: number) => `Bestellung #${n} bestätigt — Verano Exotico`,
    shippedTitle: "Deine Bestellung ist unterwegs",
    shippedIntro: (n: number) => `Deine Bestellung #${n} wurde versandt. Mit der folgenden Nummer kannst du die Sendung verfolgen:`,
    trackingLabel: "Sendungsnummer",
    trackingHint: "Je nach Zielland kann es einige Stunden dauern, bis die Nummer im Tracking-System erscheint.",
    subjectShipped: (n: number) => `Bestellung #${n} versandt — Verano Exotico`,
    reviewTitle: "Wie war's?",
    reviewIntro: (n: number) =>
      `Deine Bestellung #${n} sollte inzwischen bei dir sein. Wenn du zwei Minuten hast: Wie sitzt es, wie fühlt sich der Stoff an? Deine Ehrlichkeit hilft der Nächsten bei der Grössenwahl mehr als jedes Produktfoto.`,
    reviewCta: "Bewerten →",
    reviewVerifiedNote:
      "Über diese Links wird deine Bewertung als verifizierter Kauf gekennzeichnet. Der Name ist freiwillig — Vorname oder Pseudonym genügt.",
    reviewProblemNote:
      "Und falls etwas nicht gepasst hat: Antworte einfach auf diese E-Mail, wir finden eine Lösung.",
    subjectReview: (n: number) => `Wie war deine Bestellung #${n}?`,
  },
  en: {
    footerTagline: "Swimwear for endless summers",
    orderReceivedTitle: "Order received",
    greeting: (name: string) => `Hi ${name}!`,
    intro: "Thank you for your order. Please transfer the amount — as soon as your payment arrives, your package will be on its way.",
    orderLabel: (n: number) => `Order #${n}`,
    size: "Size",
    color: "Color",
    subtotal: "Subtotal",
    shipping: "Shipping",
    discount: "Discount",
    total: "Total",
    payTitle: "How to pay — 2 options",
    optionA: "Option A · Manual bank transfer (any currency)",
    amountLabel: "Amount",
    ibanLabel: "IBAN",
    holderLabel: "Beneficiary",
    refLabel: "Payment reference / note",
    foreignNote: (chf: string) =>
      `Equivalent to CHF ${chf} at the current rate. The amount may vary slightly on arrival depending on your bank's exchange rate — that's normal.`,
    refNote: (ref: string) =>
      `Please include the reference ${ref} — it's the only way we can match your payment. As soon as it arrives, we'll prepare your order for shipping.`,
    optionB: "Option B · Scan the QR code (CHF or EUR only)",
    qrHint: (amount: string) =>
      `Scan the QR code with your banking app (e.g. Neon, PostFinance, …) — IBAN, beneficiary and amount ${amount} are filled in automatically. You may still need to add the reference to the message field yourself.`,
    qrUnavailable:
      "There's no QR code for your chosen payment currency (only available for CHF or EUR) — please use the manual transfer above.",
    deliveryNote: "Delivery time: 5–14 business days after payment is received.",
    shippingMailNote: "We'll send you another email with the tracking number once your order has shipped.",
    addressLabel: "Shipping address",
    subjectPay: (n: number, amt: string) => `Order #${n} — please complete payment (${amt})`,
    paidTitle: "Order confirmed",
    paidIntro: "Thank you for your order — your payment has arrived. We're getting your parcel ready for shipping.",
    paidBoxTitle: "Payment received",
    paidBoxNote: "You'll get another email with the tracking number as soon as your parcel is on its way.",
    paidDeliveryNote: "Delivery time: 5–14 business days.",
    subjectPaid: (n: number) => `Order #${n} confirmed — Verano Exotico`,
    shippedTitle: "Your order is on its way",
    shippedIntro: (n: number) => `Your order #${n} has shipped. You can track your package with this number:`,
    trackingLabel: "Tracking number",
    trackingHint: "Depending on the destination it can take a few hours before the number appears in the tracking system.",
    subjectShipped: (n: number) => `Order #${n} shipped — Verano Exotico`,
    reviewTitle: "How was it?",
    reviewIntro: (n: number) =>
      `Your order #${n} should have arrived by now. If you have two minutes: how does it fit, how does the fabric feel? Your honest take helps the next person pick a size more than any product photo can.`,
    reviewCta: "Write a review →",
    reviewVerifiedNote:
      "Reviews left through these links are marked as a verified purchase. Your name is optional — a first name or nickname is fine.",
    reviewProblemNote:
      "And if something wasn't right: just reply to this email and we'll sort it out.",
    subjectReview: (n: number) => `How was your order #${n}?`,
  },
} as const;

function footer(locale: EmailLocale) {
  const t = T[locale];
  return `
    <div style="background:#F8F3E8;padding:20px 40px;text-align:center;">
      <p style="font-family:sans-serif;font-size:10px;color:rgba(26,48,64,0.45);margin:0 0 4px;letter-spacing:0.1em;">
        © ${new Date().getFullYear()} Verano Exotico · ${t.footerTagline}
      </p>
      <p style="font-family:sans-serif;font-size:10px;color:rgba(26,48,64,0.35);margin:0;line-height:1.6;">
        Verano Exotico · Joel Aschwanden · Gotthardstrasse 59 · 6460 Altdorf · Schweiz<br>
        <a href="mailto:veranoexotico@gmail.com" style="color:rgba(26,48,64,0.45);">veranoexotico@gmail.com</a> · +41 79 389 66 59
      </p>
    </div>`;
}

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string | null;
  color_name?: string | null;
  image?: string | null;
}

interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  orderNumber: number;
  items: OrderItem[];
  /** Warenwert ohne Versand */
  goodsTotal: number;
  shippingCost: number;
  /** Zahlbetrag inkl. Versand, in CHF */
  total: number;
  /** An der Kasse gewählte Zahlungswährung (z. B. "EUR") */
  currency?: string;
  /** `total` umgerechnet in `currency` */
  paymentAmount?: number;
  shippingAddress?: ShippingAddress | null;
  /** Sprache der Website zum Zeitpunkt der Bestellung — die Mail folgt dieser Sprache. */
  locale?: EmailLocale;
  /**
   * Bereits bezahlt (Stripe). Statt Zahlungsanweisungen mit IBAN und QR-Code
   * erscheint eine Zahlungsbestätigung; verschickt wird die Mail dann erst vom
   * Webhook nach bestätigter Zahlung.
   */
  paid?: boolean;
  /** Gutschein-Rabatt in CHF; `total` ist bereits abzüglich Rabatt. */
  discount?: number;
}

/**
 * Bestellbestätigung für Vorkasse/Banküberweisung: listet Artikel, Versand und
 * Total auf und enthält die Zahlungsanweisungen (IBAN + Referenz). Die Ware
 * wird erst nach Zahlungseingang bestellt/versandt.
 */
export async function sendOrderConfirmation({
  to,
  customerName,
  orderNumber,
  items,
  goodsTotal,
  shippingCost,
  total,
  currency = "CHF",
  paymentAmount,
  shippingAddress,
  locale = "de",
  paid = false,
  discount = 0,
}: SendOrderConfirmationParams) {
  const t = T[locale];
  const iban = process.env.PAYMENT_IBAN || "";
  const holder = process.env.PAYMENT_ACCOUNT_HOLDER || "Joel Aschwanden";
  const reference = `VE-${orderNumber}`;
  const isForeignCurrency = currency !== "CHF" && typeof paymentAmount === "number";

  // Schweizer QR-Rechnung: nur möglich bei CHF oder EUR (Spezifikation lässt keine
  // anderen Währungen zu). Bei EUR wird der EUR-Betrag 1:1 codiert (keine Umrechnung
  // durch uns nötig), bei CHF der CHF-Betrag.
  const qrCurrency: SwissQrCurrency | null = currency === "EUR" ? "EUR" : currency === "CHF" ? "CHF" : null;
  const qrAmount = qrCurrency === "EUR" && typeof paymentAmount === "number" ? paymentAmount : total;

  let qrBuffer: Buffer | null = null;
  if (iban && qrCurrency && !paid) {
    try {
      qrBuffer = await renderSwissQrPng({
        iban,
        creditorName: holder,
        creditorStreet: "Gotthardstrasse 59",
        creditorZip: "6460",
        creditorCity: "Altdorf",
        creditorCountry: "CH",
        amount: qrAmount,
        currency: qrCurrency,
        message: `Bestellung ${reference}`,
      });
    } catch (err) {
      console.error("QR-Rechnung konnte nicht erzeugt werden:", err);
    }
  }

  // Bereits bezahlt: keine Kontoangaben, kein QR-Code — nur die Bestätigung.
  const paidBox = `
      <div style="background:#1A3040;border-radius:12px;padding:24px;margin-top:28px;">
        <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#D4AF37;margin:0 0 10px;">${t.paidBoxTitle}</p>
        <p style="font-family:sans-serif;font-size:13px;color:#F8F3E8;line-height:1.8;margin:0;">
          ${t.amountLabel}: <strong>${isForeignCurrency ? `${currency} ${paymentAmount!.toFixed(2)}` : `CHF ${total.toFixed(2)}`}</strong><br>
          ${t.refLabel}: <strong style="font-family:monospace;">${reference}</strong>
        </p>
        <p style="font-family:sans-serif;font-size:11px;color:rgba(248,243,232,0.6);line-height:1.7;margin:14px 0 0;">
          ${t.paidBoxNote}
        </p>
      </div>`;

  const paymentBox = `
      <div style="background:#1A3040;border-radius:12px;padding:24px;margin-top:28px;">
        <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#D4AF37;margin:0 0 4px;">${t.payTitle}</p>
        <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(248,243,232,0.5);margin:0 0 14px;">${t.optionA}</p>
        <p style="font-family:sans-serif;font-size:13px;color:#F8F3E8;line-height:2;margin:0;">
          ${t.amountLabel}: <strong>${isForeignCurrency ? `${currency} ${paymentAmount!.toFixed(2)}` : `CHF ${total.toFixed(2)}`}</strong><br>
          ${iban ? `${t.ibanLabel}: <strong style="font-family:monospace;">${iban}</strong><br>` : ""}
          ${t.holderLabel}: <strong>${holder}</strong><br>
          ${t.refLabel}: <strong style="font-family:monospace;">${reference}</strong>
        </p>
        ${isForeignCurrency ? `
        <p style="font-family:sans-serif;font-size:11px;color:rgba(248,243,232,0.6);line-height:1.7;margin:10px 0 0;">
          ${t.foreignNote(total.toFixed(2))}
        </p>` : ""}
        <p style="font-family:sans-serif;font-size:11px;color:rgba(248,243,232,0.6);line-height:1.7;margin:14px 0 0;">
          ${t.refNote(reference)}
        </p>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(248,243,232,0.15);">
          <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(248,243,232,0.5);margin:0 0 10px;">${t.optionB}</p>
          ${qrBuffer ? `
          <div style="text-align:center;">
            <img src="cid:qr-payment" width="180" height="180" alt="QR" style="display:inline-block;background:#FFFFFF;border-radius:8px;padding:8px;">
            <p style="font-family:sans-serif;font-size:11px;color:rgba(248,243,232,0.6);line-height:1.6;margin:10px 0 0;">
              ${t.qrHint(`${qrCurrency} ${qrAmount.toFixed(2)}`)}
            </p>
          </div>` : `
          <p style="font-family:sans-serif;font-size:11px;color:rgba(248,243,232,0.55);line-height:1.6;margin:0;">
            ${t.qrUnavailable}
          </p>`}
        </div>
      </div>`;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;">
          <strong>${item.product_name}</strong>
          ${item.size ? `<br><span style="color:#9E9E9E;font-size:11px;">${t.size}: ${item.size}</span>` : ""}
          ${item.color_name ? `<br><span style="color:#9E9E9E;font-size:11px;">${t.color}: ${item.color_name}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:center;">
          ${item.quantity}×
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">
          CHF ${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const addressBlock = shippingAddress?.line1
    ? `
      <div style="background:#F8F3E8;border-radius:12px;padding:16px 20px;margin-top:24px;">
        <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px;">${t.addressLabel}</p>
        <p style="font-family:sans-serif;font-size:13px;color:#1A3040;line-height:1.6;margin:0;">
          ${customerName || ""}<br>
          ${shippingAddress.line1}${shippingAddress.line2 ? `<br>${shippingAddress.line2}` : ""}<br>
          ${shippingAddress.postal_code ?? ""} ${shippingAddress.city ?? ""}<br>
          ${shippingAddress.country ?? ""}
        </p>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">

    <!-- Header -->
    <div style="background:#1A3040;padding:32px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Verano Exotico</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">
        ${paid ? t.paidTitle : t.orderReceivedTitle}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="font-family:sans-serif;font-size:15px;color:#1A3040;margin:0 0 8px;">
        ${t.greeting(customerName || "")}
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.6);line-height:1.6;margin:0 0 28px;">
        ${paid ? t.paidIntro : t.intro}
      </p>

      <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9E9E9E;margin:0 0 16px;">
        ${t.orderLabel(orderNumber)}
      </p>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;">
        ${itemRows}
      </table>

      <!-- Summen -->
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="font-family:sans-serif;font-size:13px;color:rgba(26,48,64,0.6);padding:4px 0;">${t.subtotal}</td>
          <td style="font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">CHF ${goodsTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-family:sans-serif;font-size:13px;color:rgba(26,48,64,0.6);padding:4px 0;">${t.shipping}</td>
          <td style="font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">CHF ${shippingCost.toFixed(2)}</td>
        </tr>${discount > 0 ? `
        <tr>
          <td style="font-family:sans-serif;font-size:13px;color:rgba(26,48,64,0.6);padding:4px 0;">${t.discount}</td>
          <td style="font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">− CHF ${discount.toFixed(2)}</td>
        </tr>` : ""}
        <tr>
          <td style="font-family:sans-serif;font-size:13px;font-weight:700;color:#1A3040;text-transform:uppercase;letter-spacing:0.1em;padding:12px 0 0;border-top:2px solid #1A3040;">${t.total}</td>
          <td style="font-family:sans-serif;font-size:18px;font-weight:900;color:#1A3040;text-align:right;padding:12px 0 0;border-top:2px solid #1A3040;">CHF ${total.toFixed(2)}</td>
        </tr>
      </table>

      ${paid ? paidBox : paymentBox}
      ${addressBlock}

      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);margin-top:28px;line-height:1.6;">
        ${paid ? t.paidDeliveryNote : t.deliveryNote}<br>
        ${t.shippingMailNote}
      </p>
    </div>

    <!-- Footer -->
    ${footer(locale)}
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: paid
      ? t.subjectPaid(orderNumber)
      : t.subjectPay(orderNumber, isForeignCurrency ? `${currency} ${paymentAmount!.toFixed(2)}` : `CHF ${total.toFixed(2)}`),
    html,
    attachments: qrBuffer
      ? [{ filename: "qr-zahlung.png", content: qrBuffer, contentType: "image/png", contentId: "qr-payment" }]
      : undefined,
  });
}

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "aschwanden.joel@gmail.com";

interface SendAdminNewOrderParams {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  currency?: string;
  paymentAmount?: number;
  shippingAddress?: ShippingAddress | null;
  /** Zahlung ist bereits bestätigt (Stripe) — kein Bankabgleich nötig. */
  paid?: boolean;
}

/**
 * Interne Benachrichtigung an den Shop-Betreiber, sobald eine neue Bestellung
 * eingegangen ist — unabhängig von der Kundenmail. Fehler hier dürfen den
 * Checkout nicht beeinflussen; das übernimmt der Aufrufer per .catch().
 */
export async function sendAdminNewOrderNotification({
  orderNumber,
  customerName,
  customerEmail,
  items,
  total,
  currency = "CHF",
  paymentAmount,
  shippingAddress,
  paid = false,
}: SendAdminNewOrderParams) {
  const isForeignCurrency = currency !== "CHF" && typeof paymentAmount === "number";
  const amountLabel = isForeignCurrency ? `${currency} ${paymentAmount!.toFixed(2)}` : `CHF ${total.toFixed(2)}`;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;">
          ${item.product_name}${item.size ? ` · ${item.size}` : ""}${item.color_name ? ` · ${item.color_name}` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:center;">${item.quantity}×</td>
        <td style="padding:8px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">CHF ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const addressBlock = shippingAddress?.line1
    ? `${shippingAddress.line1}${shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}<br>${shippingAddress.postal_code ?? ""} ${shippingAddress.city ?? ""}<br>${shippingAddress.country ?? ""}`
    : "—";

  const html = `
<!DOCTYPE html>
<html>
<head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">
    <div style="background:#1A3040;padding:24px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 6px;">Verano Exotico · Admin</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:20px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">Neue Bestellung #${orderNumber}</h1>
    </div>
    <div style="padding:28px 40px;">
      <p style="font-family:sans-serif;font-size:13px;color:#1A3040;line-height:1.8;margin:0 0 20px;">
        <strong>${customerName || "—"}</strong> · ${customerEmail}<br>
        Betrag: <strong>${amountLabel}</strong> ${isForeignCurrency ? `(entspricht CHF ${total.toFixed(2)})` : ""}<br>
        Referenz: <strong>VE-${orderNumber}</strong>
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${itemRows}</table>
      <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#9E9E9E;margin:0 0 6px;">Lieferadresse</p>
      <p style="font-family:sans-serif;font-size:13px;color:#1A3040;line-height:1.6;margin:0 0 20px;">${addressBlock}</p>
      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.5);margin:0;">
        ${paid
          ? 'Zahlung ist über Stripe bestätigt — der CJ-Auftrag wurde automatisch ausgelöst. Im <strong>/admin</strong> prüfen, ob das Fulfillment durchgelaufen ist.'
          : 'Zahlungseingang im Bankkonto prüfen und Bestellung im <strong>/admin</strong> auf „Bezahlt“ setzen, sobald das Geld da ist.'}
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `Neue Bestellung #${orderNumber} — ${amountLabel}`,
    html,
  });
}

interface SendShippingParams {
  to: string;
  customerName: string;
  orderNumber: number;
  trackingNumber: string;
  trackingProvider?: string;
  locale?: EmailLocale;
}

export async function sendShippingNotification({
  to,
  customerName,
  orderNumber,
  trackingNumber,
  trackingProvider,
  locale = "de",
}: SendShippingParams) {
  const t = T[locale];
  const html = `
<!DOCTYPE html>
<html>
<head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">
    <div style="background:#1A3040;padding:32px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Verano Exotico</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">
        ${t.shippedTitle}
      </h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-family:sans-serif;font-size:15px;color:#1A3040;margin:0 0 8px;">${t.greeting(customerName || "")}</p>
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.6);line-height:1.6;margin:0 0 28px;">
        ${t.shippedIntro(orderNumber)}
      </p>
      <div style="background:#F8F3E8;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px;">
          ${t.trackingLabel}${trackingProvider ? ` · ${trackingProvider}` : ""}
        </p>
        <p style="font-family:monospace;font-size:18px;font-weight:700;color:#1A3040;margin:0;letter-spacing:0.05em;">${trackingNumber}</p>
      </div>
      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);margin:0;line-height:1.6;">
        ${t.trackingHint}
      </p>
    </div>
    ${footer(locale)}
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: t.subjectShipped(orderNumber),
    html,
  });
}

interface ReviewRequestItem {
  product_slug: string;
  product_name: string;
  size?: string | null;
  color_name?: string | null;
}

interface SendReviewRequestParams {
  to: string;
  customerName: string;
  orderNumber: number;
  items: ReviewRequestItem[];
  /** Signierter Token aus createReviewToken() — schaltet „verifizierter Kauf" frei */
  token: string;
  locale?: EmailLocale;
}

/**
 * Bitte um eine Produktbewertung, einige Tage nach Versand (siehe
 * /api/reviews/request). Pro bestelltem Artikel ein Link auf die Produktseite
 * mit `?r=<token>`; die Bewertung wird dadurch als verifizierter Kauf gespeichert.
 */
export async function sendReviewRequest({
  to,
  customerName,
  orderNumber,
  items,
  token,
  locale = "de",
}: SendReviewRequestParams) {
  const t = T[locale];
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Mehrfach bestellte Varianten desselben Artikels ergeben nur einen Link —
  // bewertet wird das Produkt, nicht die einzelne Position.
  const uniqueItems = items.filter(
    (item, i) => items.findIndex((other) => other.product_slug === item.product_slug) === i
  );

  const itemRows = uniqueItems
    .map((item) => {
      const url = `${base}/${locale}/product/${encodeURIComponent(item.product_slug)}?r=${token}#reviews`;
      const variant = [item.size, item.color_name].filter(Boolean).join(" · ");
      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;">
          <strong>${item.product_name}</strong>
          ${variant ? `<br><span style="color:#9E9E9E;font-size:11px;">${variant}</span>` : ""}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #F0EDE8;text-align:right;white-space:nowrap;">
          <a href="${url}" style="font-family:sans-serif;font-size:12px;font-weight:700;color:#1A3040;text-decoration:none;border-bottom:2px solid #D4AF37;padding-bottom:2px;">
            ${t.reviewCta}
          </a>
        </td>
      </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">
    <div style="background:#1A3040;padding:32px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Verano Exotico</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">
        ${t.reviewTitle}
      </h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-family:sans-serif;font-size:15px;color:#1A3040;margin:0 0 8px;">${t.greeting(customerName || "")}</p>
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.6);line-height:1.6;margin:0 0 28px;">
        ${t.reviewIntro(orderNumber)}
      </p>

      <table style="width:100%;border-collapse:collapse;">
        ${itemRows}
      </table>

      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);margin:24px 0 0;line-height:1.7;">
        ${t.reviewVerifiedNote}<br>
        ${t.reviewProblemNote}
      </p>
    </div>
    ${footer(locale)}
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: t.subjectReview(orderNumber),
    html,
  });
}

/* ─── Newsletter & Erinnerung ──────────────────────────────────────────────
 * Werbe-Mails (im Gegensatz zu den Transaktionsmails oben): Sie gehen nur an
 * Adressen mit Einwilligung, tragen einen Abmeldelink im Footer und den
 * List-Unsubscribe-Header (Ein-Klick-Abmeldung in Gmail/Apple Mail, RFC 8058).
 */

const M = {
  de: {
    confirmTitle: "Fast geschafft",
    confirmIntro:
      "Bitte bestätige noch kurz, dass du unseren Newsletter erhalten möchtest. Erst danach schicken wir dir etwas.",
    confirmCta: "Anmeldung bestätigen",
    confirmIgnore: "Du hast dich nicht angemeldet? Dann ignoriere diese Mail einfach — ohne Bestätigung passiert nichts.",
    subjectConfirm: "Bitte bestätige deine Anmeldung — Verano Exotico",
    welcomeTitle: "Willkommen",
    welcomeIntro:
      "Schön, dass du dabei bist. Du hörst von uns, wenn neue Modelle reinkommen oder es etwas Besonderes gibt — nicht öfter.",
    welcomeCodeLabel: (pct: number) => `${pct} % auf deine nächste Bestellung`,
    welcomeCodeHint: (days: number) =>
      `Gib den Code auf der Bezahlseite bei „Gutscheincode hinzufügen“ ein. Gilt auf alle Artikel (nicht auf den Versand), einmal einlösbar, ${days} Tage gültig.`,
    welcomeCta: "Zum Shop →",
    subjectWelcome: (pct: number | null) =>
      pct ? `Willkommen — dein Code für ${pct} % Rabatt` : "Willkommen bei Verano Exotico",
    recoveryTitle: "Noch da?",
    recoveryIntro:
      "Deine Bestellung ist nicht ganz durchgegangen — die Zahlung wurde nicht abgeschlossen. Deine Auswahl haben wir dir aufbewahrt:",
    recoveryCta: "Bestellung abschliessen →",
    recoveryNote:
      "Der Link ist 30 Tage gültig. Falls etwas beim Bezahlen nicht geklappt hat, antworte einfach auf diese Mail — wir helfen gern.",
    subjectRecovery: "Deine Auswahl wartet noch auf dich",
    unsubscribe: "Abmelden",
    unsubscribeNote: "Du bekommst diese Mail, weil du dich für Neuigkeiten von Verano Exotico angemeldet hast.",
  },
  en: {
    confirmTitle: "Almost there",
    confirmIntro: "Please confirm that you'd like to receive our newsletter. We won't send you anything until you do.",
    confirmCta: "Confirm subscription",
    confirmIgnore: "Didn't sign up? Just ignore this email — nothing happens without confirmation.",
    subjectConfirm: "Please confirm your subscription — Verano Exotico",
    welcomeTitle: "Welcome",
    welcomeIntro:
      "Glad you're here. You'll hear from us when new styles arrive or there's something special — no more than that.",
    welcomeCodeLabel: (pct: number) => `${pct}% off your next order`,
    welcomeCodeHint: (days: number) =>
      `Enter the code on the payment page under "Add promotion code". Applies to all items (not shipping), single use, valid for ${days} days.`,
    welcomeCta: "Visit the shop →",
    subjectWelcome: (pct: number | null) =>
      pct ? `Welcome — your code for ${pct}% off` : "Welcome to Verano Exotico",
    recoveryTitle: "Still there?",
    recoveryIntro: "Your order didn't quite go through — the payment wasn't completed. We've saved your selection:",
    recoveryCta: "Complete your order →",
    recoveryNote:
      "The link is valid for 30 days. If something went wrong with the payment, just reply to this email — we're happy to help.",
    subjectRecovery: "Your selection is still waiting for you",
    unsubscribe: "Unsubscribe",
    unsubscribeNote: "You're receiving this email because you signed up for news from Verano Exotico.",
  },
} as const;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Ziel des Abmeldelinks im Footer: Seite mit Abmelde-Knopf (kein GET-Abmelden — Link-Scanner würden sonst abmelden). */
function unsubscribePageUrl(token: string, locale: EmailLocale) {
  return `${siteUrl()}/${locale}/newsletter?a=abmelden&t=${token}`;
}

/** Ein-Klick-Abmeldung per POST, wie Gmail/Apple Mail sie über den Header auslösen. */
function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${siteUrl()}/api/newsletter/unsubscribe?t=${token}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function marketingFooter(locale: EmailLocale, token: string) {
  const m = M[locale];
  return `
    <div style="background:#F8F3E8;padding:0 40px 20px;text-align:center;">
      <p style="font-family:sans-serif;font-size:10px;color:rgba(26,48,64,0.45);margin:0;line-height:1.6;">
        ${m.unsubscribeNote}
        <a href="${unsubscribePageUrl(token, locale)}" style="color:rgba(26,48,64,0.6);">${m.unsubscribe}</a>
      </p>
    </div>`;
}

function shell(locale: EmailLocale, title: string, body: string, extraFooter = "") {
  return `
<!DOCTYPE html>
<html>
<head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">
    <div style="background:#1A3040;padding:32px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Verano Exotico</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">
        ${title}
      </h1>
    </div>
    <div style="padding:32px 40px;">
      ${body}
    </div>
    ${footer(locale)}
    ${extraFooter}
  </div>
</body>
</html>`;
}

function button(href: string, label: string) {
  return `
      <div style="text-align:center;margin:28px 0;">
        <a href="${href}" style="display:inline-block;background:#1A3040;color:#F8F3E8;font-family:sans-serif;font-size:12px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:16px 32px;border-radius:9999px;">
          ${label}
        </a>
      </div>`;
}

/** Double-Opt-in: Bestätigungslink nach Anmeldung über das Formular auf der Website. */
export async function sendNewsletterConfirmation({
  to,
  token,
  locale = "de",
}: {
  to: string;
  token: string;
  locale?: EmailLocale;
}) {
  const m = M[locale];
  const confirmUrl = `${siteUrl()}/api/newsletter/confirm?t=${token}`;
  const html = shell(
    locale,
    m.confirmTitle,
    `
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.7);line-height:1.6;margin:0;">${m.confirmIntro}</p>
      ${button(confirmUrl, m.confirmCta)}
      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);line-height:1.6;margin:0;">${m.confirmIgnore}</p>`
  );

  await resend.emails.send({ from: FROM, to, replyTo: REPLY_TO, subject: m.subjectConfirm, html });
}

/** Begrüssung nach bestätigter Anmeldung, optional mit persönlichem Rabattcode. */
export async function sendNewsletterWelcome({
  to,
  token,
  code,
  percent,
  validDays,
  locale = "de",
}: {
  to: string;
  token: string;
  code: string | null;
  percent: number;
  validDays: number;
  locale?: EmailLocale;
}) {
  const m = M[locale];
  const codeBox = code
    ? `
      <div style="background:#1A3040;border-radius:12px;padding:24px;margin-top:24px;text-align:center;">
        <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#D4AF37;margin:0 0 12px;">${m.welcomeCodeLabel(percent)}</p>
        <p style="font-family:monospace;font-size:24px;font-weight:700;color:#F8F3E8;margin:0;letter-spacing:0.1em;">${code}</p>
        <p style="font-family:sans-serif;font-size:11px;color:rgba(248,243,232,0.6);line-height:1.6;margin:14px 0 0;">${m.welcomeCodeHint(validDays)}</p>
      </div>`
    : "";

  const html = shell(
    locale,
    m.welcomeTitle,
    `
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.7);line-height:1.6;margin:0;">${m.welcomeIntro}</p>
      ${codeBox}
      ${button(`${siteUrl()}/${locale}/collection`, m.welcomeCta)}`,
    marketingFooter(locale, token)
  );

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: m.subjectWelcome(code ? percent : null),
    html,
    headers: unsubscribeHeaders(token),
  });
}

/**
 * Erinnerung bei abgebrochener Zahlung — nur mit Einwilligung aus dem
 * Bestellformular. Der Link führt auf eine neue Stripe-Bezahlseite mit
 * denselben Artikeln (after_expiration.recovery, 30 Tage gültig).
 */
export async function sendCartRecovery({
  to,
  customerName,
  items,
  recoveryUrl,
  token,
  locale = "de",
}: {
  to: string;
  customerName: string;
  items: OrderItem[];
  recoveryUrl: string;
  token: string;
  locale?: EmailLocale;
}) {
  const m = M[locale];
  const t = T[locale];
  const itemRows = items
    .map((item) => {
      const variant = [item.size, item.color_name].filter(Boolean).join(" · ");
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;">
          <strong>${item.product_name}</strong>
          ${variant ? `<br><span style="color:#9E9E9E;font-size:11px;">${variant}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">
          ${item.quantity}×
        </td>
      </tr>`;
    })
    .join("");

  const html = shell(
    locale,
    m.recoveryTitle,
    `
      <p style="font-family:sans-serif;font-size:15px;color:#1A3040;margin:0 0 8px;">${t.greeting(customerName || "")}</p>
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.7);line-height:1.6;margin:0 0 20px;">${m.recoveryIntro}</p>
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
      ${button(recoveryUrl, m.recoveryCta)}
      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);line-height:1.6;margin:0;">${m.recoveryNote}</p>`,
    marketingFooter(locale, token)
  );

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: m.subjectRecovery,
    html,
    headers: unsubscribeHeaders(token),
  });
}
