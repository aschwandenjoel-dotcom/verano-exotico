import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * Öffentliche Produkt-Reviews, gespeichert in der Supabase-Tabelle `reviews`
 * (SQL siehe LAUNCH_CHECKLIST.md). Existiert die Tabelle noch nicht, liefert
 * GET eine leere Liste und POST einen 503 — der Shop bleibt funktionsfähig.
 */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug fehlt" }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .select("id, name, rating, comment, created_at")
    .eq("product_slug", slug)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
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

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .insert({ product_slug: slug, name, rating, comment })
    .select("id, name, rating, comment, created_at")
    .single();

  if (error) {
    const missing = error.code === "PGRST205" || /Could not find the table/i.test(error.message);
    return NextResponse.json(
      { error: missing ? "Bewertungen sind derzeit nicht verfügbar." : error.message },
      { status: missing ? 503 : 500 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}
