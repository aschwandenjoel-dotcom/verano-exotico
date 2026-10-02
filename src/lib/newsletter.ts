import { randomBytes, randomUUID } from "crypto";
import { execute, query, queryOne } from "@/lib/db";
import { sendNewsletterConfirmation, sendNewsletterWelcome, type EmailLocale } from "@/lib/email";
import { paymentMode, stripe } from "@/lib/stripe";
import { WELCOME_CODE_VALID_DAYS, WELCOME_DISCOUNT_PERCENT } from "@/lib/newsletterOffer";

/**
 * Newsletter-Liste mit Double-Opt-in. Eine Adresse gilt erst als angemeldet,
 * wenn `confirmed_at` gesetzt und `unsubscribed_at` leer ist — nur an solche
 * Adressen dürfen Newsletter gehen.
 *
 * Zwei Wege hinein:
 * - Formular auf der Website → Bestätigungsmail, Klick auf den Link bestätigt.
 * - Häkchen im Bestellformular → bestätigt, sobald die Bestellung bezahlt ist
 *   (siehe Stripe-Webhook). Bis dahin dient der Eintrag nur dem Abmeldelink
 *   in der Erinnerungsmail.
 */

export interface Subscriber {
  id: string;
  email: string;
  locale: string | null;
  token: string | null;
  source: string | null;
  confirmed_at: string | null;
  confirm_sent_at: string | null;
  unsubscribed_at: string | null;
  welcome_code: string | null;
  welcome_sent_at: string | null;
}

/** Erneute Bestätigungsmail an dieselbe Adresse frühestens nach dieser Zeit. */
const CONFIRM_RESEND_MINUTES = 10;

export function newToken(): string {
  return randomBytes(16).toString("hex");
}

export function toEmailLocale(locale: string | null | undefined): EmailLocale {
  return locale === "en" ? "en" : "de";
}

export async function findByEmail(email: string) {
  return queryOne<Subscriber>("SELECT * FROM newsletter_subscribers WHERE email = ?", [email]);
}

export async function findByToken(token: string) {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  return queryOne<Subscriber>("SELECT * FROM newsletter_subscribers WHERE token = ?", [token]);
}

/**
 * Anmeldung über das Formular. Antwortet nach aussen immer gleich, damit sich
 * nicht herausfinden lässt, welche Adressen schon auf der Liste stehen.
 */
export async function subscribeViaForm(email: string, locale: EmailLocale) {
  let sub = await findByEmail(email);

  if (sub && sub.confirmed_at && !sub.unsubscribed_at) return; // bereits angemeldet

  if (!sub) {
    await query(
      "INSERT INTO newsletter_subscribers (id, email, locale, token, source) VALUES (?, ?, ?, ?, 'form')",
      [randomUUID(), email, locale, newToken()]
    );
  } else {
    // Abgemeldet oder nie bestätigt: neu ansetzen, alte Bestätigung zählt nicht mehr.
    await query(
      `UPDATE newsletter_subscribers
          SET locale = ?, token = coalesce(token, ?), confirmed_at = NULL, unsubscribed_at = NULL
        WHERE id = ?`,
      [locale, newToken(), sub.id]
    );
  }

  // Sperre gegen Mail-Bombing: Nur wer die Sperre setzt, verschickt die Mail.
  sub = await findByEmail(email);
  if (!sub?.token) return;
  const claimed = await execute(
    `UPDATE newsletter_subscribers SET confirm_sent_at = now()
      WHERE id = ? AND (confirm_sent_at IS NULL OR confirm_sent_at < date_sub(now(), interval ${CONFIRM_RESEND_MINUTES} minute))`,
    [sub.id]
  );
  if (claimed === 0) return;

  await sendNewsletterConfirmation({ to: email, token: sub.token, locale });
}

/**
 * Häkchen im Bestellformular: Eintrag anlegen (unbestätigt), damit die
 * Erinnerungsmail einen Abmeldelink hat. Wer sich vorher abgemeldet hatte und
 * jetzt wieder anhakt, ist wieder dabei.
 */
export async function subscribeViaCheckout(email: string, locale: EmailLocale) {
  const sub = await findByEmail(email);
  if (!sub) {
    await query(
      "INSERT INTO newsletter_subscribers (id, email, locale, token, source) VALUES (?, ?, ?, ?, 'checkout')",
      [randomUUID(), email, locale, newToken()]
    );
    return;
  }
  await query(
    "UPDATE newsletter_subscribers SET token = coalesce(token, ?), unsubscribed_at = NULL WHERE id = ?",
    [newToken(), sub.id]
  );
}

/** Bestätigt die Anmeldung und verschickt beim ersten Mal die Willkommensmail. */
export async function confirmSubscriber(sub: Subscriber) {
  await query(
    "UPDATE newsletter_subscribers SET confirmed_at = coalesce(confirmed_at, now()), unsubscribed_at = NULL WHERE id = ?",
    [sub.id]
  );
  await sendWelcomeOnce(sub);
}

/** Abmeldung — idempotent, ein zweiter Klick schadet nicht. */
export async function unsubscribe(sub: Subscriber) {
  await query(
    "UPDATE newsletter_subscribers SET unsubscribed_at = coalesce(unsubscribed_at, now()) WHERE id = ?",
    [sub.id]
  );
}

/**
 * Willkommensmail genau einmal pro Adresse — auch wer sich ab- und wieder
 * anmeldet, bekommt keinen zweiten Rabattcode.
 */
async function sendWelcomeOnce(sub: Subscriber) {
  if (!sub.token) return;
  const claimed = await execute(
    "UPDATE newsletter_subscribers SET welcome_sent_at = now() WHERE id = ? AND welcome_sent_at IS NULL",
    [sub.id]
  );
  if (claimed === 0) return;

  let code: string | null = null;
  try {
    code = await createWelcomeCode(sub.email);
    if (code) {
      await query("UPDATE newsletter_subscribers SET welcome_code = ? WHERE id = ?", [code, sub.id]);
    }
  } catch (err) {
    // Ohne Code trotzdem begrüssen — der Rabatt lässt sich von Hand nachreichen.
    console.error("[newsletter] Rabattcode fehlgeschlagen:", err instanceof Error ? err.message : err);
  }

  try {
    await sendNewsletterWelcome({
      to: sub.email,
      token: sub.token,
      code,
      percent: WELCOME_DISCOUNT_PERCENT,
      validDays: WELCOME_CODE_VALID_DAYS,
      locale: toEmailLocale(sub.locale),
    });
  } catch (err) {
    // Sperre zurücknehmen, damit ein späterer Versuch die Mail noch verschickt.
    await query("UPDATE newsletter_subscribers SET welcome_sent_at = NULL WHERE id = ?", [sub.id]);
    throw err;
  }
}

/**
 * Persönlicher Einmal-Code in Stripe. Der zugrunde liegende Coupon wird beim
 * ersten Mal angelegt; die ID enthält den Prozentsatz, sodass eine Änderung
 * von WELCOME_DISCOUNT_PERCENT einen neuen Coupon erzeugt statt den alten zu verändern.
 */
async function createWelcomeCode(email: string): Promise<string | null> {
  if (WELCOME_DISCOUNT_PERCENT <= 0 || paymentMode() !== "stripe") return null;

  const couponId = `newsletter-willkommen-${WELCOME_DISCOUNT_PERCENT}`;
  try {
    await stripe().coupons.retrieve(couponId);
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
    await stripe().coupons.create({
      id: couponId,
      name: `Newsletter-Willkommen ${WELCOME_DISCOUNT_PERCENT} %`,
      percent_off: WELCOME_DISCOUNT_PERCENT,
      duration: "once",
    });
  }

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O, 1/I — gut abtippbar
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const code = `HALLO-${suffix}`;

  await stripe().promotionCodes.create({
    promotion: { type: "coupon", coupon: couponId },
    code,
    max_redemptions: 1,
    expires_at: Math.floor(Date.now() / 1000) + WELCOME_CODE_VALID_DAYS * 24 * 60 * 60,
    metadata: { source: "newsletter", email },
  });
  return code;
}
