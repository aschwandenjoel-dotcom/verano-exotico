"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/newsletterOffer";
import NewsletterInput from "./NewsletterInput";

/** Nach so viel Zeit auf der Seite (über Seitenwechsel hinweg) erscheint das Popup. */
const DELAY_MS = 2 * 60 * 1000;
// Wie H&M: Geschlossen gilt nur für diesen Besuch (sessionStorage) – beim nächsten
// Besuch kommt das Popup wieder. Wer sich angemeldet hat, sieht es nie mehr (localStorage).
const START_KEY = "ve_nl_popup_start"; // sessionStorage: Beginn des Besuchs
const CLOSED_KEY = "ve_nl_popup_closed"; // sessionStorage: in diesem Besuch geschlossen
const SUBSCRIBED_KEY = "ve_nl_subscribed"; // localStorage: angemeldet
const IMAGE = "/products/bahia-bandeau-bikini-model.jpg";

/** Auf Kasse und Bestellbestätigung stört das Popup nur. */
const blockedPath = () => /\/(checkout|order-confirmation)(\/|$)/.test(window.location.pathname);

function read(storage: () => Storage, key: string): string | null {
  try { return storage().getItem(key); } catch { return null; }
}
function write(storage: () => Storage, key: string, value: string) {
  try { storage().setItem(key, value); } catch { /* privater Modus o. ä. – dann eben ohne Merken */ }
}

/**
 * Newsletter-Popup wie bei Hunza G: links ein Bild, rechts "10 % Rabatt sichern"
 * mit E-Mail-Feld. Liegt im Locale-Layout, damit die Zeit beim Seitenwechsel
 * weiterläuft.
 */
export default function NewsletterPopup() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (WELCOME_DISCOUNT_PERCENT <= 0) return;
    if (read(() => localStorage, SUBSCRIBED_KEY)) return;
    if (read(() => sessionStorage, CLOSED_KEY)) return;

    let start = Number(read(() => sessionStorage, START_KEY) ?? 0);
    if (!start) {
      start = Date.now();
      write(() => sessionStorage, START_KEY, String(start));
    }
    let timer: ReturnType<typeof setTimeout>;
    const tryOpen = () => {
      // An der Kasse warten und später nochmals prüfen
      if (blockedPath()) timer = setTimeout(tryOpen, 30_000);
      else setOpen(true);
    };
    timer = setTimeout(tryOpen, Math.max(0, start + DELAY_MS - Date.now()));
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    write(() => sessionStorage, CLOSED_KEY, "1");
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(10,25,35,0.55)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nl-popup-title"
        className="relative grid md:grid-cols-2 w-full overflow-hidden"
        style={{ maxWidth: "980px", maxHeight: "calc(100vh - 32px)", background: "#FFFFFF" }}
      >
        <div className="relative hidden md:block" style={{ minHeight: "560px" }}>
          <Image src={IMAGE} alt="" fill sizes="490px" style={{ objectFit: "cover", objectPosition: "top" }} />
        </div>

        <div className="flex flex-col justify-center text-center" style={{ padding: "56px clamp(24px, 5vw, 48px)" }}>
          <h2 id="nl-popup-title" style={{ fontFamily: "var(--font-dm-serif)", fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)", color: "#1A3040", lineHeight: 1.1, marginBottom: "18px" }}>
            {t("popup_title", { percent: WELCOME_DISCOUNT_PERCENT })}
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#1A3040", marginBottom: "28px" }}>
            {t("popup_text", { percent: WELCOME_DISCOUNT_PERCENT })}
          </p>
          <NewsletterInput variant="light" onSuccess={() => write(() => localStorage, SUBSCRIBED_KEY, String(Date.now()))} />
          <p style={{ fontSize: "11px", lineHeight: 1.6, color: "rgba(26,48,64,0.6)", marginTop: "22px" }}>
            {t.rich("popup_fine", {
              privacy: (chunks) => (
                <a href={`/${locale}/datenschutz`} style={{ textDecoration: "underline", textUnderlineOffset: "2px", color: "inherit" }}>
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          style={{
            position: "absolute", top: 14, right: 14, width: 40, height: 40, borderRadius: "50%",
            border: "1.5px solid #1A3040", background: "#FFFFFF", color: "#1A3040",
            fontSize: 20, lineHeight: 1, cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
