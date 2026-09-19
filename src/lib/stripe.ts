import Stripe from "stripe";

/**
 * Zahlungsart des Shops. Die frühere Vorkasse (IBAN + Schweizer QR-Rechnung)
 * ist vollständig erhalten und lässt sich ohne Code-Änderung reaktivieren:
 *
 *   PAYMENT_MODE=prepay   → Vorkasse wie bisher (0 % Gebühren)
 *   PAYMENT_MODE=stripe   → Stripe Checkout
 *
 * Ohne gesetzte Variable entscheidet das Vorhandensein von STRIPE_SECRET_KEY.
 * Der Code-Stand vor der Umstellung liegt zusätzlich im Git-Tag `vorkasse-v1`
 * und im Branch `backup/vorkasse`.
 */
export type PaymentMode = "stripe" | "prepay";

export function paymentMode(): PaymentMode {
  const configured = (process.env.PAYMENT_MODE ?? "").trim().toLowerCase();
  if (configured === "prepay" || configured === "stripe") return configured;
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "prepay";
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY fehlt");
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * Stripe rechnet in der kleinsten Währungseinheit. Alle an der Kasse
 * wählbaren Währungen (CHF, EUR, USD, GBP, CAD, AUD) haben zwei
 * Nachkommastellen — deshalb genügt ×100.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
