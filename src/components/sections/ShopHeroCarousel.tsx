"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// "contain" slides are narrower than the hero band and would lose people
// to top/bottom cropping under object-fit: cover, so they get a blurred
// cover backdrop behind a fully-visible contain image instead.
const SLIDES: { src: string; fit: "cover" | "contain" }[] = [
  { src: "/images/shop-hero-1.webp", fit: "cover" },
  { src: "/images/shop-hero-3.webp", fit: "contain" },
  { src: "/images/shop-hero-4.webp", fit: "cover" },
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
      {SLIDES.map(({ src, fit }, i) => (
        <div
          key={src}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === active ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        >
          {fit === "contain" && (
            <Image
              src={src}
              alt=""
              aria-hidden="true"
              fill
              priority={i === 0}
              sizes="100vw"
              style={{
                objectFit: "cover",
                objectPosition: "center 36%",
                transform: "scale(1.15)",
                filter: "blur(40px) brightness(0.7)",
              }}
            />
          )}
          <Image
            src={src}
            alt={i === 0 ? alt : ""}
            fill
            priority={i === 0}
            sizes="100vw"
            style={{
              objectFit: fit,
              objectPosition: "center 36%",
            }}
          />
        </div>
      ))}
    </>
  );
}
