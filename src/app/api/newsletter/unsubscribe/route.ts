import { NextResponse } from "next/server";
import { findByToken, toEmailLocale, unsubscribe } from "@/lib/newsletter";

/**
 * Abmeldung, nur per POST:
 * - Ein-Klick aus dem Mailprogramm (List-Unsubscribe-Post, RFC 8058):
 *   POST /api/newsletter/unsubscribe?t=<token> → 200
 * - Knopf auf /<locale>/newsletter?a=abmelden: Formular mit `t` und
 *   `von=seite` → Weiterleitung auf die Statusseite.
 *
 * Bewusst kein GET: Link-Scanner (Outlook, Virenscanner) rufen Links in Mails
 * automatisch auf und würden sonst Leute ungewollt abmelden.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("t") ?? url.searchParams.get("t") ?? "");
  const fromPage = form?.get("von") === "seite";

  const sub = await findByToken(token).catch(() => null);
  if (!sub) {
    return fromPage
      ? NextResponse.redirect(`${base}/de/newsletter?s=ungueltig`, 303)
      : NextResponse.json({ error: "Unbekannter Link" }, { status: 404 });
  }

  await unsubscribe(sub);
  return fromPage
    ? NextResponse.redirect(`${base}/${toEmailLocale(sub.locale)}/newsletter?s=abgemeldet`, 303)
    : NextResponse.json({ ok: true });
}
