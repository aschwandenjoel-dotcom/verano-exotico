"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-dark" />,
});

interface Props {
  locale: Locale;
}

export default function HeroSection({ locale }: Props) {
  const t = useTranslations("hero");

  return (
    <section className="relative h-screen w-full overflow-hidden bg-bg-dark flex items-center">
      <div className="absolute inset-0">
        <HeroScene />
      </div>

      <div className="relative z-10 px-6 md:px-10 w-full max-w-5xl">
        <p className="text-xs font-mono tracking-[0.3em] text-tan uppercase mb-8">
          {t("eyebrow")}
        </p>

        <h1
          className="font-black leading-[0.88] tracking-tight text-text-primary mb-8 select-none"
          style={{ fontSize: "clamp(4rem, 14vw, 14rem)" }}
        >
          <span className="block">VERANO</span>
          <span
            className="block italic"
            style={{ WebkitTextStroke: "2px #F2EDE4", color: "transparent" }}
          >
            EXOTICO
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <p className="text-sm text-text-muted max-w-xs leading-relaxed">
            {t("subline")}
          </p>
          <div className="flex gap-3 shrink-0">
            <Link
              href={`/${locale}/collection`}
              className="inline-flex items-center px-6 py-3 bg-primary text-cream text-xs font-bold tracking-widest uppercase hover:bg-primary/80 transition-colors"
            >
              {t("cta_primary")}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center px-6 py-3 border border-white/20 text-text-primary text-xs font-bold tracking-widest uppercase hover:border-cream/50 transition-colors"
            >
              {t("cta_secondary")}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-10 hidden md:flex flex-col items-end gap-1">
        <span className="text-xs font-mono text-text-muted tracking-widest">SS25</span>
        <div className="w-12 h-px bg-tan" />
      </div>
    </section>
  );
}
