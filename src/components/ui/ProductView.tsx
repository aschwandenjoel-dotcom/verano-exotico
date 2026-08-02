"use client";

import { useState } from "react";
import ProductGallery from "./ProductGallery";
import ProductDetail from "./ProductDetail";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
  labels: {
    color: string;
    size: string;
    selectSize: string;
    addToCart: string;
    added: string;
    sizeGuide: string;
    details: string;
    material: string;
    care: string;
    measurements: string;
    shipping: string;
    trustShipping: string;
    trustReturns: string;
    trustPayment: string;
  };
}

/**
 * Hält die gemeinsame Farb-Auswahl: Ein Klick auf einen Farb-Swatch (in ProductDetail)
 * oder auf ein Farb-Thumbnail (in ProductGallery) aktualisiert beide Seiten synchron —
 * die Galerie zeigt dann das passende Bild dieser Farbe.
 */
export default function ProductView({ product, locale, labels }: Props) {
  const [activeColor, setActiveColor] = useState(0);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <ProductGallery
        product={product}
        locale={locale}
        activeColor={activeColor}
        onSelectColor={setActiveColor}
      />
      <ProductDetail
        product={product}
        locale={locale}
        labels={labels}
        activeColor={activeColor}
        onSelectColor={setActiveColor}
      />
    </div>
  );
}
