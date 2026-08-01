import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

/**
 * Öffentliche Produkt-Reviews, gespeichert in der MySQL-Tabelle `reviews`
 * (SQL siehe hostpoint-schema.sql). Existiert die Tabelle noch nicht, liefert
 * GET eine leere Liste und POST einen 503 — der Shop bleibt funktionsfähig.
 */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug fehlt" }, { status: 400 });

  try {
    const rows = await query(
      "SELECT id, name, rating, comment, created_at FROM reviews WHERE product_slug = ? AND approved = true ORDER BY created_at DESC LIMIT 50",
      [slug]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = String(body?.productSlug ?? "").trim();
  const name = String(body?.name ?? "").trim().slice(0, 80) || "Anonym";
  const rating = Number(body?.rating);
  const comment = String(body?.comment ?? "").trim().slice(0, 2000);

  if (!slug || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 2) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const id = randomUUID();
  try {
    await query(
      "INSERT INTO reviews (id, product_slug, name, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [id, slug, name, rating, comment]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const missing = /doesn't exist|no such table/i.test(message);
    return NextResponse.json(
      { error: missing ? "Bewertungen sind derzeit nicht verfügbar." : message },
      { status: missing ? 503 : 500 }
    );
  }

  const row = await queryOne(
    "SELECT id, name, rating, comment, created_at FROM reviews WHERE id = ?",
    [id]
  );
  return NextResponse.json(row, { status: 201 });
}
