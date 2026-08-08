"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Each slide is cropped edge-to-edge (object-fit: cover). objectPositionY
// controls which horizontal band of the image stays in frame — lower values
// keep heads in, higher values keep feet/ground in.
const SLIDES: { src: string; objectPositionY: string }[] = [
  { src: "/images/shop-hero-1.webp", objectPositionY: "36%" },
  { src: "/images/shop-hero-3.webp", objectPositionY: "12%" },
  { src: "/images/shop-hero-4.webp", objectPositionY: "36%" },
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
      {SLIDES.map(({ src, objectPositionY }, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          fill
          priority={i === 0}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: `center ${objectPositionY}`,
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
