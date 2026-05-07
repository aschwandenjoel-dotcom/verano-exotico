"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/types";

interface Props {
  locale: Locale;
}

export default function LanguageSwitcher({ locale }: Props) {
  const pathname = usePathname();

  function getLocaleHref(targetLocale: Locale): string {
    const segments = pathname.split("/");
    segments[1] = targetLocale;
    return segments.join("/") || "/";
  }

  return (
    <div className="flex items-center gap-1 text-sm font-mono" style={{ color: "#D4AF37" }}>
      {(["de", "en"] as Locale[]).map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span style={{ color: "#D4AF37", opacity: 0.4 }}>/</span>}
          <Link
            href={getLocaleHref(loc)}
            className={
              locale === loc
                ? "font-bold"
                : "hover:opacity-75 transition-opacity"
            }
          >
            {loc.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
