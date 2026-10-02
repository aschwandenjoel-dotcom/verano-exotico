import { NextResponse } from "next/server";
import { subscribeViaForm, toEmailLocale } from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Anmeldung über das Formular auf der Website. Speichert die Adresse
 * unbestätigt und verschickt den Bestätigungslink (Double-Opt-in, siehe
 * src/lib/newsletter.ts). Die Antwort ist für neue, bestehende und
 * abgemeldete Adressen gleich.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 200);
  const locale = toEmailLocale(String(body?.locale ?? "de"));

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }

  try {
    await subscribeViaForm(email, locale);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[newsletter] Anmeldung fehlgeschlagen:", message);
    const missing = /doesn't exist|no such table|unknown column/i.test(message);
    return NextResponse.json(
      { error: missing ? "Anmeldung derzeit nicht möglich." : "Anmeldung fehlgeschlagen." },
      { status: missing ? 503 : 500 }
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
