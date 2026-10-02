import { NextResponse } from "next/server";
import { confirmSubscriber, findByToken, toEmailLocale } from "@/lib/newsletter";

/**
 * Bestätigungslink aus der Double-Opt-in-Mail:
 *   GET /api/newsletter/confirm?t=<token>
 * Bestätigt die Anmeldung, verschickt die Willkommensmail und leitet auf die
 * Statusseite /<locale>/newsletter weiter.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const token = url.searchParams.get("t") ?? "";

  const sub = await findByToken(token).catch(() => null);
  if (!sub) {
    return NextResponse.redirect(`${base}/de/newsletter?s=ungueltig`, 303);
  }

  const locale = toEmailLocale(sub.locale);
  try {
    await confirmSubscriber(sub);
  } catch (err) {
    // Die Bestätigung selbst ist gespeichert — nur die Willkommensmail fehlt.
    console.error("[newsletter] Bestätigung:", err instanceof Error ? err.message : err);
  }
  return NextResponse.redirect(`${base}/${locale}/newsletter?s=bestaetigt`, 303);
}
