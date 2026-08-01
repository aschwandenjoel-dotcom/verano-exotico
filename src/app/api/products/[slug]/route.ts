import { NextResponse } from "next/server";
import { queryOne, parseJson } from "@/lib/db";
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const row = await queryOne("SELECT * FROM products WHERE slug = ? AND active = true", [slug]);
  if (!row) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(rowToProduct(row));
}
