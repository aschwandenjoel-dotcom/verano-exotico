import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { SURVEY_SOURCES } from "@/lib/survey";

/**
 * Speichert die Antwort auf "Wie hast du uns gefunden?" zur Bestellung.
 * Nur einmal pro Bestellung, nur für bestehende Bestellungen (UUID ist nicht
 * erratbar). Spalten: hostpoint-migration-survey.sql.
 */
export async function POST(req: Request) {
  if (rateLimited(`survey:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const { orderId, source } = (body ?? {}) as Record<string, unknown>;
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Ungültige Bestellung" }, { status: 400 });
  }
  if (typeof source !== "string" || !(SURVEY_SOURCES as readonly string[]).includes(source)) {
    return NextResponse.json({ error: "Ungültige Antwort" }, { status: 400 });
  }

  try {
    await execute(
      `UPDATE orders SET survey_source = ?, survey_answered_at = now()
       WHERE id = ? AND survey_source IS NULL AND status <> 'payment_failed'`,
      [source, orderId]
    );
  } catch (err) {
    // Migration noch nicht eingespielt: Kundin bekommt trotzdem ein Danke
    if (/unknown column/i.test(err instanceof Error ? err.message : String(err))) {
      console.warn("survey: hostpoint-migration-survey.sql fehlt");
      return NextResponse.json({ ok: true, stored: false });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}
