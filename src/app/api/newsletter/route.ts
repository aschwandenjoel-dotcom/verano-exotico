import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const locale = String(body?.locale ?? "de").slice(0, 5);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }

  try {
    await query(
      "INSERT INTO newsletter_subscribers (id, email, locale) VALUES (?, ?, ?)",
      [randomUUID(), email, locale]
    );
  } catch (err) {
    const code = (err as { code?: string })?.code;
    // Bereits angemeldet → als Erfolg behandeln (idempotent)
    if (code === "ER_DUP_ENTRY") return NextResponse.json({ ok: true });
    const message = err instanceof Error ? err.message : String(err);
    const missing = /doesn't exist|no such table/i.test(message);
    return NextResponse.json(
      { error: missing ? "Anmeldung derzeit nicht möglich." : message },
      { status: missing ? 503 : 500 }
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
