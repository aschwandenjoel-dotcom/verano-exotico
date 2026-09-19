import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { verifyReviewToken } from "@/lib/reviewToken";

/**
 * Öffentliche Produkt-Reviews, gespeichert in der MySQL-Tabelle `reviews`
 * (SQL siehe hostpoint-schema.sql). Existiert die Tabelle noch nicht, liefert
 * GET eine leere Liste und POST einen 503 — der Shop bleibt funktionsfähig.
 *
 * Enthält der POST einen gültigen Token aus der Bewertungs-Mail (`?r=` auf der
 * Produktseite) und gehört das Produkt zu dieser Bestellung, wird die Bewertung
 * als verifizierter Kauf gespeichert.
 */

/** Erkennt eine DB ohne die Spalten aus hostpoint-migration-reviews.sql. */
function isMissingColumn(err: unknown): boolean {
  return /unknown column/i.test(err instanceof Error ? err.message : String(err));
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug fehlt" }, { status: 400 });

  const select = (columns: string) =>
    query(
      `SELECT ${columns} FROM reviews WHERE product_slug = ? AND approved = true ORDER BY created_at DESC LIMIT 50`,
      [slug]
    );

  try {
    return NextResponse.json(await select("id, name, rating, comment, verified, created_at"));
  } catch (err) {
    // Migration noch nicht eingespielt: lieber ohne Verifiziert-Badge anzeigen
    // als gar keine Bewertungen.
    if (isMissingColumn(err)) {
      try {
        return NextResponse.json(await select("id, name, rating, comment, created_at"));
      } catch {
        return NextResponse.json([]);
      }
    }
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = String(body?.productSlug ?? "").trim();
  const name = String(body?.name ?? "").trim().slice(0, 80) || "Anonym";
  const rating = Number(body?.rating);
  const comment = String(body?.comment ?? "").trim().slice(0, 2000);
  const token = String(body?.token ?? "").trim();

  if (!slug || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 2) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  // Verifizierter Kauf: Token muss gültig sein UND die Bestellung muss genau
  // dieses Produkt enthalten. Ist eines von beidem nicht erfüllt, wird die
  // Bewertung ganz normal als unverifiziert gespeichert.
  let orderId: string | null = null;
  if (token) {
    const id = verifyReviewToken(token);
    if (id) {
      const item = await queryOne(
        "SELECT id FROM order_items WHERE order_id = ? AND product_slug = ? LIMIT 1",
        [id, slug]
      ).catch(() => null);
      if (item) orderId = id;
    }
  }

  const id = randomUUID();
  try {
    try {
      await query(
        "INSERT INTO reviews (id, product_slug, name, rating, comment, order_id, verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, slug, name, rating, comment, orderId, !!orderId]
      );
    } catch (err) {
      // Migration noch nicht eingespielt → ohne die neuen Spalten speichern
      if (!isMissingColumn(err)) throw err;
      await query(
        "INSERT INTO reviews (id, product_slug, name, rating, comment) VALUES (?, ?, ?, ?, ?)",
        [id, slug, name, rating, comment]
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/duplicate entry/i.test(message)) {
      return NextResponse.json(
        { error: "Für diesen Artikel liegt aus deiner Bestellung bereits eine Bewertung vor." },
        { status: 409 }
      );
    }
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
  return NextResponse.json({ ...row, verified: !!orderId }, { status: 201 });
}
