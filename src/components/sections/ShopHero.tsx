"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import AiBadge from "@/components/ui/AiBadge";

/**
 * Titelbild des Shops: bleibt kleben, die Produkte gleiten darüber. Das Bild ist
 * vollständig zu sehen (kein Zoom); beim Scrollen wird es sanft abgedunkelt – wie
 * ein Vorhang, der sich über eine Kampagne legt. Bei "Bewegung reduzieren" ruhig.
 */
export default function ShopHero({ src, alt }: { src: string; alt: string }) {
  const t = useTranslations("shophero");
  const tl = useTranslations("landing");
  const year = new Date().getFullYear();
  const shadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    // Direkt am DOM: läuft bei jedem Scroll-Frame und braucht keinen React-State
    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
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
      <Image src={src} alt={alt} fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 30%" }} />
      {/* oben ein Hauch Dunkel für den durchsichtigen Header */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,25,35,0.35) 0%, rgba(5,25,35,0) 22%)" }}
      />
      {/* wird beim Scrollen dichter, während die Produkte darübergleiten */}
      <div ref={shadeRef} aria-hidden="true" style={{ position: "absolute", inset: 0, background: "#051923", opacity: 0 }} />
      {/* dezent unten links wie auf der Startseite, das Model bleibt frei */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,25,35,0.4) 0%, rgba(5,25,35,0) 35%)" }}
      />
      <div className="absolute left-6 md:left-10" style={{ bottom: "clamp(56px, 7vw, 88px)", color: "#F8F3E8" }}>
        <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
          {tl("season", { year })}
        </p>
        <p style={{ margin: 0, lineHeight: 1.0 }}>
          <span style={{ display: "block", fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(1.6rem, 3.4vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            {t("title_1")}
          </span>
          <span style={{ display: "block", fontFamily: "var(--font-dm-serif)", fontSize: "clamp(1.6rem, 3.4vw, 3rem)", fontStyle: "italic", color: "#D4AF37" }}>
            {t("title_2")}
          </span>
        </p>
      </div>
      {/* über dem Rand des Produktrasters, damit sie sichtbar bleibt */}
      <div style={{ position: "absolute", right: 0, bottom: "48px", left: 0, height: 0 }}>
        <AiBadge inset={16} />
      </div>
    </div>
  );
}
