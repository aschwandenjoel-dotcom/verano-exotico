"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/10 px-6 py-12 md:px-10 bg-bg-dark">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-10">
          <div>
            <p className="text-xs font-black tracking-[0.2em] uppercase text-cream">VERANO EXOTICO</p>
            <p className="mt-2 text-xs font-mono text-tan italic">{t("tagline")}</p>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-mono tracking-widest uppercase text-text-muted">
            <a href="#" className="hover:text-cream transition-colors">{t("links_legal")}</a>
            <a href="#" className="hover:text-cream transition-colors">{t("links_privacy")}</a>
          </div>
        </div>
        <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[10px] font-mono text-text-muted">© {new Date().getFullYear()} Verano Exotico. Alle Rechte vorbehalten.</p>
          <p className="text-[10px] font-mono text-text-muted">Curated worldwide. Shipped to you.</p>
        </div>
      </div>
    </footer>
  );
}
