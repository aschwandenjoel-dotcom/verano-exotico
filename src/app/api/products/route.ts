import { NextResponse } from "next/server";
import { query, parseJson } from "@/lib/db";
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
    description: { de: row.description_de as string, en: row.description_en as string },
    material: { de: row.material_de as string, en: row.material_en as string },
    care: { de: row.care_de as string, en: row.care_en as string },
    ...(row.measurements_de ? { measurements: { de: row.measurements_de as string, en: row.measurements_en as string } } : {}),
    ...(row.size_chart ? { sizeChart: parseJson<Product["sizeChart"]>(row.size_chart, undefined) } : {}),
  };
}

export async function GET() {
  try {
    const rows = await query("SELECT * FROM products WHERE active = true ORDER BY created_at ASC");
    return NextResponse.json(rows.map(rowToProduct));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler" }, { status: 500 });
  }
}
