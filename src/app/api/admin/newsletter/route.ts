import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { query, queryOne } from "@/lib/db";
import {
  renderNewsletter,
  sendNewsletterBatch,
  sendNewsletterTest,
  type EmailLocale,
  type NewsletterContent,
  type NewsletterRecipient,
} from "@/lib/email";

export const maxDuration = 60;

/** Pro Aufruf höchstens so viele Empfänger — das Tool ruft wiederholt auf, bis alle durch sind. */
const PER_CALL = 300;
const BATCH = 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Row {
  id: string;
  email: string;
  token: string;
  locale: string | null;
}

/**
 * Newsletter-Versand für tools/newsletter-send.mjs. Nur mit Header
 * `x-admin-key: <ADMIN_PASSWORD>`.
 *
 * Body: { aktion, kampagne, inhalt: { de, en? }, testAn? }
 * - "status": Anzahl bestätigter Empfänger, davon schon versandt
 * - "vorschau": fertiges Mail-HTML je Sprache (ohne Versand)
 * - "test":   eine Testmail je Sprache an `testAn`
 * - "senden": bis zu 300 noch offene Empfänger dieser Kampagne; das
 *             Versandprotokoll (newsletter_sends) verhindert Doppelversand
 *
 * Empfänger sind ausschliesslich bestätigte, nicht abgemeldete Adressen.
 * Fehlt die englische Fassung, bekommen englische Abonnenten die deutsche.
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const aktion = String(body?.aktion ?? "");
  const kampagne = String(body?.kampagne ?? "");
  if (!/^[a-z0-9-]{3,80}$/.test(kampagne)) {
    return NextResponse.json({ error: "kampagne: 3–80 Zeichen, nur a-z, 0-9 und -" }, { status: 400 });
  }

  const de = parseContent(body?.inhalt?.de);
  const en = parseContent(body?.inhalt?.en) ?? de;
  if (!de && aktion !== "status") {
    return NextResponse.json({ error: "inhalt.de fehlt (betreff und html sind Pflicht)" }, { status: 400 });
  }

  try {
    if (aktion === "status") {
      const counts = await query<{ locale: string | null; total: number; sent: number }>(
        `SELECT s.locale, count(*) AS total, sum(n.subscriber_id IS NOT NULL) AS sent
           FROM newsletter_subscribers s
           LEFT JOIN newsletter_sends n ON n.campaign = ? AND n.subscriber_id = s.id
          WHERE s.confirmed_at IS NOT NULL AND s.unsubscribed_at IS NULL AND s.token IS NOT NULL
          GROUP BY s.locale`,
        [kampagne]
      );
      const last = await queryOne<{ campaign: string; sent_at: string }>(
        "SELECT campaign, max(sent_at) AS sent_at FROM newsletter_sends WHERE campaign <> ? GROUP BY campaign ORDER BY sent_at DESC LIMIT 1",
        [kampagne]
      );
      return NextResponse.json({
        empfaenger: counts.map((c) => ({ sprache: c.locale ?? "de", total: Number(c.total), versandt: Number(c.sent ?? 0) })),
        letzteKampagne: last,
      });
    }

    if (aktion === "vorschau") {
      const placeholder = "0".repeat(32);
      return NextResponse.json({
        de: renderNewsletter(de!, "de", placeholder),
        en: body?.inhalt?.en ? renderNewsletter(en!, "en", placeholder) : null,
      });
    }

    if (aktion === "test") {
      const to = String(body?.testAn ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
        return NextResponse.json({ error: "testAn: gültige E-Mail-Adresse nötig" }, { status: 400 });
      }
      await sendNewsletterTest(to, de!, "de");
      if (body?.inhalt?.en) await sendNewsletterTest(to, en!, "en");
      return NextResponse.json({ ok: true });
    }

    if (aktion === "senden") {
      const rows = await query<Row>(
        `SELECT s.id, s.email, s.token, s.locale
           FROM newsletter_subscribers s
           LEFT JOIN newsletter_sends n ON n.campaign = ? AND n.subscriber_id = s.id
          WHERE s.confirmed_at IS NOT NULL AND s.unsubscribed_at IS NULL AND s.token IS NOT NULL
            AND n.subscriber_id IS NULL
          ORDER BY s.created_at
          LIMIT ${PER_CALL}`,
        [kampagne]
      );

      let sent = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const recipients: NewsletterRecipient[] = chunk.map((r) => ({
          email: r.email,
          token: r.token,
          locale: (r.locale === "en" ? "en" : "de") as EmailLocale,
        }));
        // Gleicher Schlüssel bei Wiederholung → Resend verschickt nicht doppelt (24 h).
        const key = createHash("sha256").update(kampagne + chunk.map((r) => r.id).join(",")).digest("hex");
        await sendNewsletterBatch(recipients, { de: de!, en: en! }, `newsletter-${key.slice(0, 40)}`);
        await query(
          `INSERT IGNORE INTO newsletter_sends (campaign, subscriber_id) VALUES ${chunk.map(() => "(?, ?)").join(", ")}`,
          chunk.flatMap((r) => [kampagne, r.id])
        );
        sent += chunk.length;
        await sleep(600); // Resend: höchstens 2 Anfragen pro Sekunde
      }

      const rest = await queryOne<{ n: number }>(
        `SELECT count(*) AS n
           FROM newsletter_subscribers s
           LEFT JOIN newsletter_sends n ON n.campaign = ? AND n.subscriber_id = s.id
          WHERE s.confirmed_at IS NOT NULL AND s.unsubscribed_at IS NULL AND s.token IS NOT NULL
            AND n.subscriber_id IS NULL`,
        [kampagne]
      );
      return NextResponse.json({ gesendet: sent, verbleibend: Number(rest?.n ?? 0) });
    }

    return NextResponse.json({ error: 'aktion: "status", "test" oder "senden"' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const missing = /doesn't exist|unknown column/i.test(message);
    return NextResponse.json(
      { error: missing ? `Migration fehlt: hostpoint-migration-newsletter.sql ausführen (${message})` : message },
      { status: missing ? 503 : 500 }
    );
  }
}

function parseContent(raw: unknown): NewsletterContent | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const subject = String(c.subject ?? "").trim();
  const html = String(c.html ?? "").trim();
  if (!subject || !html) return null;
  return {
    subject: subject.slice(0, 200),
    preheader: c.preheader ? String(c.preheader).slice(0, 200) : undefined,
    html,
    buttonLabel: c.buttonLabel ? String(c.buttonLabel).slice(0, 60) : undefined,
    buttonUrl: c.buttonUrl ? String(c.buttonUrl) : undefined,
  };
}
