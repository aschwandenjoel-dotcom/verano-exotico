export type Locale = "de" | "en";

export interface Review {
  id: string;
  productSlug: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  slug: string;
  name: { de: string; en: string };
  price: number;
  category: "tops" | "bottoms" | "outerwear" | "accessories";
  isNew: boolean;
  colors: string[];
  colorNames?: { de: string[]; en: string[] };
  sizes?: string[];
  measurements?: { de: string; en: string };
  images?: string[];
  description: { de: string; en: string };
  material: { de: string; en: string };
  care: { de: string; en: string };
}
