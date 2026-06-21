"use client";

import { useState } from "react";
import Image from "next/image";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
}

export default function ProductGallery({ product }: Props) {
  const images = product.images ?? [];
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden bg-surface flex items-center justify-center">
        <div className="flex items-end gap-3">
          {product.colors.slice(0, 3).map((color, i) => (
            <div
              key={color}
              className="rounded-sm"
              style={{ background: color, width: 48, height: 64 + i * 24, opacity: 0.85 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "16px", overflow: "hidden", background: "#EDE9E2" }}>
        <Image
          key={active}
          src={images[active]}
          alt={product.name.de}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={[
                "relative flex-1 h-24 rounded-xl overflow-hidden border-2 transition-all",
                i === active ? "border-white/60" : "border-white/10 hover:border-white/30",
              ].join(" ")}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="20vw"
                className="object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
