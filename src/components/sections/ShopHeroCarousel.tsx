"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  "/images/shop-hero-1.webp",
  "/images/shop-hero-2.webp",
  "/images/shop-hero-3.webp",
  "/images/shop-hero-4.webp",
];

const INTERVAL_MS = 10000;
const FADE_MS = 1600;

export default function ShopHeroCarousel({ alt }: { alt: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          fill
          priority={i === 0}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center 36%",
            position: "absolute",
            inset: 0,
            opacity: i === active ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}
    </>
  );
}
