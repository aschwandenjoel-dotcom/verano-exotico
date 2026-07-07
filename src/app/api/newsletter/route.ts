import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const locale = String(body?.locale ?? "de").slice(0, 5);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db.from("newsletter_subscribers").insert({ email, locale });

  if (error) {
    // Bereits angemeldet → als Erfolg behandeln (idempotent)
    if (error.code === "23505") return NextResponse.json({ ok: true });
    const missing = error.code === "PGRST205" || /Could not find the table/i.test(error.message);
    return NextResponse.json(
      { error: missing ? "Anmeldung derzeit nicht möglich." : error.message },
      { status: missing ? 503 : 500 }
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
