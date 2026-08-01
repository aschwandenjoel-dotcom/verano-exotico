import { query, queryOne, parseJson } from "@/lib/db";
import type { Product } from "@/types";
import { products as localProducts } from "@/lib/products";

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

export async function fetchProducts(): Promise<Product[]> {
  try {
    const rows = await query(
      "SELECT * FROM products WHERE active = true ORDER BY created_at ASC"
    );
    if (rows.length === 0) return localProducts;
    return rows.map(rowToProduct);
  } catch {
    return localProducts;
  }
}

/** Die zuletzt hinzugefügten aktiven Produkte (für die Startseite). */
export async function fetchLatestProducts(limit = 6): Promise<Product[]> {
  try {
    const rows = await query(
      "SELECT * FROM products WHERE active = true ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    if (rows.length === 0) return localProducts.slice(0, limit);
    return rows.map(rowToProduct);
  } catch {
    return localProducts.slice(0, limit);
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const row = await queryOne(
      "SELECT * FROM products WHERE slug = ? AND active = true",
      [slug]
    );
    if (!row) return localProducts.find((p) => p.slug === slug) ?? null;
    return rowToProduct(row);
  } catch {
    return localProducts.find((p) => p.slug === slug) ?? null;
  }
}
