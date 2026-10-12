"use client";

import { useId, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

/**
 * Newsletter-Anmeldung (Double-Opt-in über /api/newsletter).
 * "dark": Feld und Knopf nebeneinander für dunkle Flächen (Footer);
 * "light": untereinander, Knopf dunkelblau in voller Breite (Popup).
 */
export default function NewsletterInput({
  variant = "dark",
  onSuccess,
}: {
  variant?: "dark" | "light";
  onSuccess?: () => void;
}) {
  const light = variant === "light";
  // Eindeutig pro Feld – Footer und Popup können gleichzeitig auf der Seite sein
  const inputId = useId();
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      if (res.ok) { setSubmitted(true); onSuccess?.(); }
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm tracking-widest uppercase" style={{ color: light ? "#1A3040" : "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
        ✓ {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={light ? "flex flex-col gap-4 w-full" : "flex flex-col sm:flex-row gap-0 w-full max-w-md"}>
      <label htmlFor={inputId} className="sr-only">{t("placeholder")}</label>
      <input
        id={inputId}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder")}
        required
        className="flex-1 bg-transparent px-4 py-3 text-sm outline-none transition-colors"
        style={{
          border: `1px solid ${light ? "rgba(26,48,64,0.35)" : "rgba(248,243,232,0.3)"}`,
          color: light ? "#1A3040" : "#F8F3E8",
          fontFamily: "var(--font-geist-mono)",
          minHeight: light ? "52px" : "44px",
        }}
        onFocus={(e) => (e.target.style.borderColor = light ? "#1A3040" : "#D4AF37")}
        onBlur={(e) => (e.target.style.borderColor = light ? "rgba(26,48,64,0.35)" : "rgba(248,243,232,0.3)")}
      />
      <button
        type="submit"
        disabled={sending}
        className="px-6 py-3 text-[10px] font-black tracking-[0.25em] uppercase transition-colors hover:opacity-80"
        style={{
          fontFamily: "var(--font-archivo-black), sans-serif",
          background: light ? "#1A3040" : "#D4AF37",
          color: light ? "#F8F3E8" : "#1A3040",
          minHeight: light ? "52px" : "44px",
          opacity: sending ? 0.7 : 1,
        }}
      >
        {sending ? "…" : t("submit")}
      </button>
      {failed && (
        <p className={light ? "text-[11px]" : "text-[11px] sm:self-center sm:ml-3 mt-2 sm:mt-0"} style={{ color: light ? "#B4553C" : "#E8A0A0", fontFamily: "var(--font-geist-mono)" }}>
          {t("error")}
        </p>
      )}
    </form>
  );
}
