import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Product } from "@/types";

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    slug: row.slug as string,
    name: { de: row.name_de as string, en: row.name_en as string },
    price: Number(row.price),
    category: row.category as Product["category"],
    isNew: row.is_new as boolean,
    colors: (row.colors as string[]) ?? [],
    colorNames: {
      de: (row.color_names_de as string[]) ?? [],
      en: (row.color_names_en as string[]) ?? [],
    },
    sizes: (row.sizes as string[]) ?? [],
    images: (row.images as string[]) ?? [],
    description: { de: row.description_de as string, en: row.description_en as string },
    material: { de: row.material_de as string, en: row.material_en as string },
    care: { de: row.care_de as string, en: row.care_en as string },
    ...(row.measurements_de ? { measurements: { de: row.measurements_de as string, en: row.measurements_en as string } } : {}),
    ...(row.size_chart ? { sizeChart: row.size_chart as Product["sizeChart"] } : {}),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = createServiceClient();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(rowToProduct(data));
}
