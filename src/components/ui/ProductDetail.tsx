"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Locale, Product } from "@/types";
import { useCart } from "@/context/CartContext";

const SizeGuide = dynamic(() => import("./SizeGuide"), { ssr: false });

interface Props {
  product: Product;
  locale: Locale;
  activeColor: number;
  onSelectColor: (i: number) => void;
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

export default function ProductDetail({ product, locale: loc, labels: t, activeColor, onSelectColor }: Props) {
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);
  // Der Hinweis erscheint erst nach einem Klick auf "In den Warenkorb" —
  // eine Fehlermeldung schon beim Öffnen der Seite wäre eine Rüge für etwas,
  // das die Kundin noch gar nicht falsch gemacht hat.
  const [sizeHint, setSizeHint] = useState(false);
  const { addItem } = useCart();

  // Produkte mit Grössenauswahl dürfen nicht ohne Grösse in den Warenkorb:
  // die CJ-Variante wird über "Farbe|Grösse" aufgelöst (src/lib/cjMapping.ts),
  // eine Position ohne Grösse liesse sich später nicht bestellen.
  const needsSize = (product.sizes?.length ?? 0) > 0;
  const sizeMissing = needsSize && !activeSize;

  function chooseSize(size: string) {
    setActiveSize(size);
    setSizeHint(false);
  }

  function handleAddToCart() {
    if (sizeMissing) {
      setSizeHint(true);
      return;
    }
    const colorHex = product.colors[activeColor];
    const colorName = product.colorNames?.[loc]?.[activeColor];
    addItem({
      id: `${product.slug}-${colorHex}-${activeSize ?? "one-size"}`,
      productSlug: product.slug,
      name: product.name[loc],
      price: product.price,
      image: product.colorImages?.[activeColor] || product.images?.[0],
      color: colorHex,
      colorName,
      size: activeSize ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="pt-4 md:pt-8">
      <p
        className="text-xs font-mono tracking-widest uppercase mb-3"
        style={{ color: "#00B4C5" }}
      >
        {product.category}
      </p>

      <h1
        className="text-4xl md:text-5xl font-black mb-4"
        style={{ color: "#1A3040" }}
      >
        {product.name[loc]}
      </h1>

      <p className="text-3xl font-bold mb-8" style={{ color: "#D4AF37" }}>
        CHF {product.price.toFixed(2)}
      </p>

      {/* Color swatches */}
      {product.colors.length > 0 && (
        <div className="mb-8">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-3"
            style={{ color: "#5E7A8A" }}
          >
            {t.color}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color, i) => {
              const name = product.colorNames?.[loc]?.[i];
              const img = product.colorImages?.[i];
              return (
                <div key={i} className="group relative">
                  <div
                    onClick={() => onSelectColor(i)}
                    className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      backgroundImage: img ? `url("${img}")` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center 30%",
                      border: `2px solid ${activeColor === i ? "#1A3040" : "rgba(26,48,64,0.15)"}`,
                      outline: activeColor === i ? "2px solid #1A3040" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                  {name && (
                    <span
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: "#0A3D52", color: "#F8F3E8", borderRadius: "3px" }}
                    >
                      {name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mb-8">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-3"
            style={{ color: sizeHint && sizeMissing ? "#B4553C" : "#5E7A8A" }}
          >
            {t.size}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => chooseSize(size)}
                className="px-4 py-2 text-xs font-mono transition-all"
                style={{
                  border: `1px solid ${activeSize === size ? "#00B4C5" : "rgba(26,48,64,0.2)"}`,
                  color: activeSize === size ? "#00B4C5" : "#1A3040",
                  borderRadius: "6px",
                  background: "transparent",
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="w-full py-4 font-semibold text-base transition-all mb-4"
        style={{
          background: added ? "#2E7D5E" : "#D4AF37",
          color: added ? "#F8F3E8" : "#1A3040",
          borderRadius: "9999px",
          cursor: "pointer",
          transition: "background 0.3s, color 0.3s",
        }}
      >
        {added ? t.added : t.addToCart}
      </button>

      {sizeHint && sizeMissing && (
        <p
          className="text-xs font-mono text-center mb-4"
          style={{ color: "#B4553C" }}
          role="alert"
        >
          {t.selectSize}
        </p>
      )}

      {/* Versand-Hinweis direkt bei der Kaufentscheidung */}
      <p className="text-xs font-mono text-center mb-4" style={{ color: "rgba(26,48,64,0.5)" }}>
        {t.shipping}
      </p>

      {product.sizeChart && (
        <button
          onClick={() => setSizeGuideOpen(true)}
          className="w-full py-4 font-semibold text-base transition-colors mb-10"
          style={{
            border: "1px solid rgba(26,48,64,0.2)",
            color: "#1A3040",
            borderRadius: "9999px",
            background: "transparent",
          }}
        >
          {t.sizeGuide}
        </button>
      )}

      {sizeGuideOpen && (
        <SizeGuide product={product} onClose={() => setSizeGuideOpen(false)} />
      )}

      {/* Trust bar */}
      <div className="flex items-center justify-center gap-5 flex-wrap mb-10">
        {[t.trustShipping, t.trustReturns, t.trustPayment].map((item) => (
          <span
            key={item}
            className="text-[10px] font-mono tracking-widest uppercase"
            style={{ color: "rgba(26,48,64,0.55)" }}
          >
            ✓ {item}
          </span>
        ))}
      </div>

      {/* Details */}
      <div className="space-y-6 pt-8" style={{ borderTop: "1px solid rgba(26,48,64,0.1)" }}>
        {[
          { label: t.details, content: product.description[loc] },
          { label: t.material, content: product.material[loc] },
          { label: t.care, content: product.care[loc] },
          ...(product.measurements
            ? [{ label: t.measurements, content: product.measurements[loc] }]
            : []),
        ].map(({ label, content }) => (
          <div key={label}>
            <h3
              className="text-sm font-mono font-bold uppercase tracking-widest mb-2"
              style={{ color: "#5E7A8A" }}
            >
              {label}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(26,48,64,0.65)" }}>
              {content}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
