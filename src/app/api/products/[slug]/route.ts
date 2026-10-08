import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { query, queryOne, parseJson } from "@/lib/db";
import type { Product } from "@/types";

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    slug: row.slug as string,
    name: { de: row.name_de as string, en: row.name_en as string },
    price: Number(row.price),
    category: row.category as Product["category"],
    isNew: row.is_new as boolean,
    colors: parseJson<string[]>(row.colors, []),
    colorNames: {
      de: parseJson<string[]>(row.color_names_de, []),
      en: parseJson<string[]>(row.color_names_en, []),
    },
    sizes: parseJson<string[]>(row.sizes, []),
    images: parseJson<string[]>(row.images, []),
    colorImages: parseJson<string[]>(row.color_images, []),
    description: { de: row.description_de as string, en: row.description_en as string },
    material: { de: row.material_de as string, en: row.material_en as string },
    care: { de: row.care_de as string, en: row.care_en as string },
    ...(row.measurements_de ? { measurements: { de: row.measurements_de as string, en: row.measurements_en as string } } : {}),
    ...(row.size_chart ? { sizeChart: parseJson<Product["sizeChart"]>(row.size_chart, undefined) } : {}),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const row = await queryOne("SELECT * FROM products WHERE slug = ? AND active = true", [slug]);
  if (!row) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(rowToProduct(row));
}

/** Texte, die per PATCH geändert werden dürfen — Preis, Bilder, Varianten bleiben unberührt. */
const EDITABLE_TEXT_COLUMNS = [
  "name_de", "name_en",
  "description_de", "description_en",
  "material_de", "material_en",
  "care_de", "care_en",
] as const;

/**
 * Produkttexte ändern (Admin): Header `x-admin-key: <ADMIN_PASSWORD>`,
 * Body z. B. { "name_de": "…", "description_de": "…" }. Genutzt von
 * tools/update-product-texts.mjs.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { slug } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });

  const updates = EDITABLE_TEXT_COLUMNS.filter((c) => typeof body[c] === "string" && (body[c] as string).trim());
  const unknown = Object.keys(body).filter((k) => !(EDITABLE_TEXT_COLUMNS as readonly string[]).includes(k));
  if (unknown.length) return NextResponse.json({ error: `Unbekannte Felder: ${unknown.join(", ")}` }, { status: 400 });
  if (!updates.length) return NextResponse.json({ error: "Keine Felder zum Ändern" }, { status: 400 });

  const existing = await queryOne("SELECT slug FROM products WHERE slug = ?", [slug]);
  if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await query(
    `UPDATE products SET ${updates.map((c) => `${c} = ?`).join(", ")} WHERE slug = ?`,
    [...updates.map((c) => (body[c] as string).trim()), slug]
  );
  revalidatePath("/", "layout");

  const row = await queryOne("SELECT * FROM products WHERE slug = ?", [slug]);
  return NextResponse.json({ ok: true, updated: updates, product: row ? rowToProduct(row) : null });
}
