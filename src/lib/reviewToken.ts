import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signierte Einweg-Links für Bewertungsanfragen: Die Bewertungs-Mail enthält
 * pro Artikel einen Link mit `?r=<token>`. Wer den Token vorweisen kann, hat
 * die Mail zu einer echten, versandten Bestellung erhalten — nur dann wird die
 * Bewertung als „verifizierter Kauf" markiert.
 *
 * Der Token braucht keine eigene Tabelle: Er ist die Bestell-ID plus HMAC
 * darüber. Ohne `REVIEW_TOKEN_SECRET` werden keine Tokens erzeugt und keine
 * akzeptiert (fail closed) — Bewertungen sind dann einfach unverifiziert.
 */

function secret(): string {
  return process.env.REVIEW_TOKEN_SECRET || "";
}

const HEX32 = /^[0-9a-f]{32}$/;

function sign(orderId: string): string {
  // 128 Bit gekürzt reichen für einen Link, der nur eine Bewertung freischaltet
  return createHmac("sha256", secret()).update(orderId).digest("hex").slice(0, 32);
}

/** char(36)-UUID → 32 Hex-Zeichen (kürzerer Link) */
function compact(orderId: string): string {
  return orderId.replace(/-/g, "").toLowerCase();
}

/** Gegenstück zu compact() — stellt die Bindestriche der UUID wieder her */
function expand(hex: string): string {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export function createReviewToken(orderId: string): string | null {
  if (!secret()) return null;
  const hex = compact(orderId);
  if (!HEX32.test(hex)) return null;
  return `${hex}.${sign(orderId)}`;
}

/** Gibt die Bestell-ID zurück, wenn die Signatur stimmt — sonst null. */
export function verifyReviewToken(token: string): string | null {
  if (!secret()) return null;

  const [idPart, signature] = token.split(".");
  if (!idPart || !signature) return null;

  const hex = idPart.toLowerCase();
  const sig = signature.toLowerCase();
  if (!HEX32.test(hex) || !HEX32.test(sig)) return null;

  const orderId = expand(hex);
  const expected = Buffer.from(sign(orderId));
  const given = Buffer.from(sig);

  return given.length === expected.length && timingSafeEqual(given, expected) ? orderId : null;
}
