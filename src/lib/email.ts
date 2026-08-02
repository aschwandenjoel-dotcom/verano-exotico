import nodemailer from "nodemailer";
import { renderSwissQrPng, type SwissQrCurrency } from "@/lib/swissQr";

/**
 * Transaktionsmails gehen direkt über das Gmail-Konto veranoexotico@gmail.com
 * (SMTP + App-Passwort). GMAIL_APP_PASSWORD ist ein 16-stelliges App-Passwort
 * aus den Google-Kontoeinstellungen — nicht das normale Gmail-Passwort.
 */
const GMAIL_USER = process.env.GMAIL_USER ?? "veranoexotico@gmail.com";
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
const FROM = process.env.MAIL_FROM ?? `Verano Exotico <${GMAIL_USER}>`;
const REPLY_TO = process.env.MAIL_REPLY_TO ?? GMAIL_USER;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!GMAIL_APP_PASSWORD) {
    throw new Error(
      "GMAIL_APP_PASSWORD fehlt — ohne App-Passwort kann keine Mail über veranoexotico@gmail.com versendet werden."
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  /** Für <img src="cid:…"> im HTML */
  cid?: string;
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}) {
  await getTransporter().sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}

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
    shippedTitle: "Deine Bestellung ist unterwegs",
    shippedIntro: (n: number) => `Deine Bestellung #${n} wurde versandt. Mit der folgenden Nummer kannst du die Sendung verfolgen:`,
    trackingLabel: "Sendungsnummer",
    trackingHint: "Je nach Zielland kann es einige Stunden dauern, bis die Nummer im Tracking-System erscheint.",
    subjectShipped: (n: number) => `Bestellung #${n} versandt — Verano Exotico`,
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
    shippedTitle: "Your order is on its way",
    shippedIntro: (n: number) => `Your order #${n} has shipped. You can track your package with this number:`,
    trackingLabel: "Tracking number",
    trackingHint: "Depending on the destination it can take a few hours before the number appears in the tracking system.",
    subjectShipped: (n: number) => `Order #${n} shipped — Verano Exotico`,
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
  if (iban && qrCurrency) {
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
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">

    <!-- Header -->
    <div style="background:#1A3040;padding:32px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Verano Exotico</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">
        ${t.orderReceivedTitle}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="font-family:sans-serif;font-size:15px;color:#1A3040;margin:0 0 8px;">
        ${t.greeting(customerName || "")}
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.6);line-height:1.6;margin:0 0 28px;">
        ${t.intro}
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
        </tr>
        <tr>
          <td style="font-family:sans-serif;font-size:13px;font-weight:700;color:#1A3040;text-transform:uppercase;letter-spacing:0.1em;padding:12px 0 0;border-top:2px solid #1A3040;">${t.total}</td>
          <td style="font-family:sans-serif;font-size:18px;font-weight:900;color:#1A3040;text-align:right;padding:12px 0 0;border-top:2px solid #1A3040;">CHF ${total.toFixed(2)}</td>
        </tr>
      </table>

      ${paymentBox}
      ${addressBlock}

      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);margin-top:28px;line-height:1.6;">
        ${t.deliveryNote}<br>
        ${t.shippingMailNote}
      </p>
    </div>

    <!-- Footer -->
    ${footer(locale)}
  </div>
</body>
</html>`;

  await sendMail({
    to,
    subject: t.subjectPay(orderNumber, isForeignCurrency ? `${currency} ${paymentAmount!.toFixed(2)}` : `CHF ${total.toFixed(2)}`),
    html,
    attachments: qrBuffer
      ? [{ filename: "qr-zahlung.png", content: qrBuffer, contentType: "image/png", cid: "qr-payment" }]
      : undefined,
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
<head><meta charset="utf-8"></head>
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

  await sendMail({
    to,
    subject: t.subjectShipped(orderNumber),
    html,
  });
}
