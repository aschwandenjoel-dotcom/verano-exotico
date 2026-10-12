"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

/** Newsletter-Anmeldung (Double-Opt-in über /api/newsletter) – für dunkle Flächen gestaltet. */
export default function NewsletterInput() {
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
      if (res.ok) setSubmitted(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm tracking-widest uppercase" style={{ color: "#D4AF37", fontFamily: "var(--font-geist-mono)" }}>
        ✓ {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 w-full max-w-md">
      <label htmlFor="newsletter-email" className="sr-only">{t("placeholder")}</label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder")}
        required
        className="flex-1 bg-transparent px-4 py-3 text-sm outline-none transition-colors"
        style={{
          border: "1px solid rgba(248,243,232,0.3)",
          color: "#F8F3E8",
          fontFamily: "var(--font-geist-mono)",
          minHeight: "44px",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#D4AF37")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(248,243,232,0.3)")}
      />
      <button
        type="submit"
        disabled={sending}
        className="px-6 py-3 text-[10px] font-black tracking-[0.25em] uppercase transition-colors hover:opacity-80"
        style={{ fontFamily: "var(--font-archivo-black), sans-serif", background: "#D4AF37", color: "#1A3040", minHeight: "44px", opacity: sending ? 0.7 : 1 }}
      >
        {sending ? "…" : t("submit")}
      </button>
      {failed && (
        <p className="text-[11px] sm:self-center sm:ml-3 mt-2 sm:mt-0" style={{ color: "#E8A0A0", fontFamily: "var(--font-geist-mono)" }}>
          {t("error")}
        </p>
      )}
    </form>
  );
}
