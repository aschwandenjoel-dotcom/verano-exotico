"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import AiBadge from "@/components/ui/AiBadge";

/**
 * Titelbild des Shops: bleibt kleben, die Produkte gleiten darüber. Beim Scrollen
 * zoomt das Bild sanft heraus und wird leicht abgedunkelt – wie ein Vorhang, der
 * sich über eine Kampagne legt. Bei "Bewegung reduzieren" bleibt es ruhig.
 */
export default function ShopHero({ src, alt }: { src: string; alt: string }) {
  const zoomRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    // Direkt am DOM: läuft bei jedem Scroll-Frame und braucht keinen React-State
    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      if (zoomRef.current) zoomRef.current.style.transform = `scale(${1.08 - 0.08 * progress})`;
      if (shadeRef.current) shadeRef.current.style.opacity = String(0.5 * progress);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        width: "100%",
        height: "clamp(360px, 56vw, 100svh)",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <div ref={zoomRef} style={{ position: "absolute", inset: 0, transform: "scale(1.08)", willChange: "transform" }}>
        <Image src={src} alt={alt} fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 30%" }} />
      </div>
      {/* oben ein Hauch Dunkel für den durchsichtigen Header */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,25,35,0.35) 0%, rgba(5,25,35,0) 22%)" }}
      />
      {/* wird beim Scrollen dichter, während die Produkte darübergleiten */}
      <div ref={shadeRef} aria-hidden="true" style={{ position: "absolute", inset: 0, background: "#051923", opacity: 0 }} />
      {/* über dem Rand des Produktrasters, damit sie sichtbar bleibt */}
      <div style={{ position: "absolute", right: 0, bottom: "48px", left: 0, height: 0 }}>
        <AiBadge inset={16} />
      </div>
    </div>
  );
}
