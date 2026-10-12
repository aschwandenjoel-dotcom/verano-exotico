"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  /** true, wenn die Bewertung über den Link aus der Bewertungs-Mail kam */
  verified?: boolean;
  created_at: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (interactive ? hovered || value : value);
        return (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(star)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "20px",
              lineHeight: 1,
              cursor: interactive ? "pointer" : "default",
              color: filled ? "#D4AF37" : "rgba(26,48,64,0.2)",
              transition: "color 0.15s",
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, locale, verifiedLabel }: { review: Review; locale: string; verifiedLabel: string }) {
  const date = new Date(review.created_at).toLocaleDateString(
    locale === "de" ? "de-CH" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div style={{
      padding: "20px 0",
      borderBottom: "1px solid rgba(26,48,64,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px", gap: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A3040" }}>
          {review.name}
          {review.verified && (
            <span style={{
              marginLeft: "8px",
              fontSize: "9px",
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#00B4C5",
              border: "1px solid rgba(0,180,197,0.35)",
              borderRadius: "9999px",
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}>
              ✓ {verifiedLabel}
            </span>
          )}
        </span>
        <span style={{ fontSize: "11px", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)", whiteSpace: "nowrap" }}>{date}</span>
      </div>
      <Stars value={review.rating} />
      <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.7)", lineHeight: 1.7, marginTop: "10px" }}>
        {review.comment}
      </p>
    </div>
  );
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  background: "#FFFFFF",
  border: `1px solid ${hasError ? "#C0392B" : "rgba(26,48,64,0.15)"}`,
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "13px",
  color: "#1A3040",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
});

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontFamily: "var(--font-geist-mono)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(26,48,64,0.5)",
  marginBottom: "8px",
};

const noopSubscribe = () => () => {};

/**
 * Bewertungen eines Produkts laden. Der Token aus der Bewertungs-Mail
 * (…/product/slug?r=<token>#reviews) wird erst im Browser gelesen – so bleibt die
 * Produktseite statisch und braucht keine Suspense-Grenze für useSearchParams.
 */
export function useProductReviews(productSlug: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const token = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("r") ?? "",
    () => "",
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled && Array.isArray(data)) setReviews(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [productSlug]);

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const addReview = useCallback((r: Review) => setReviews((prev) => [r, ...prev]), []);
  return { reviews, avg, token, addReview };
}

/** Kleine Sterne mit Schnitt und Anzahl, z. B. unter dem Preis. Ohne Bewertungen nichts. */
export function RatingSummary({ avg, count, onClick }: { avg: number; count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#1A3040" }}
    >
      <StaticStars value={avg} size={14} />
      <span className="text-sm underline underline-offset-4">{avg.toFixed(1)} ({count})</span>
    </button>
  );
}

/** Sterne für Anzeige, auch halbe Werte (Schnitt) – gefüllter Anteil per Breite. */
function StaticStars({ value, size }: { value: number; size: number }) {
  return (
    <span style={{ position: "relative", display: "inline-block", fontSize: size, lineHeight: 1, letterSpacing: "1px" }} aria-hidden>
      <span style={{ color: "rgba(26,48,64,0.2)" }}>★★★★★</span>
      <span style={{ position: "absolute", inset: 0, width: `${(value / 5) * 100}%`, overflow: "hidden", whiteSpace: "nowrap", color: "#1A3040" }}>
        ★★★★★
      </span>
    </span>
  );
}

/**
 * Bewertungen wie bei H&M: Seitenleiste von rechts mit Schnitt, Liste und Formular.
 * Ohne Bewertungen (oder über den Mail-Link) ist das Formular gleich offen.
 */
export function ReviewDrawer({
  open, onClose, productSlug, reviews, avg, token, onAdded,
}: {
  open: boolean;
  onClose: () => void;
  productSlug: string;
  reviews: Review[];
  avg: number;
  token: string;
  onAdded: (r: Review) => void;
}) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formWanted, setFormWanted] = useState(false);
  const showForm = formWanted || reviews.length === 0 || !!token;

  // Escape schliesst, Seite dahinter scrollt nicht mit
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0)    { setError("rating");  return; }
    if (!comment.trim()) { setError("comment"); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, name: name.trim(), rating, comment: comment.trim(), token }),
      });
      if (res.status === 409) { setError("duplicate"); return; }
      if (!res.ok) { setError("submit"); return; }
      onAdded(await res.json());
      setSubmitted(true);
      setFormWanted(false);
      setName(""); setRating(0); setComment("");
    } catch {
      setError("submit");
    } finally {
      setSubmitting(false);
    }
  }, [productSlug, name, rating, comment, token, onAdded]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} role="dialog" aria-modal="true" aria-labelledby="reviews-title">
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,48,64,0.35)" }} />
      <div
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)",
          background: "#F8F3E8", overflowY: "auto", padding: "28px clamp(20px, 5vw, 32px) 40px",
          boxShadow: "-12px 0 40px rgba(26,48,64,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <h2 id="reviews-title" style={{ fontSize: "18px", fontWeight: 600, color: "#1A3040", margin: 0 }}>
            {t("count_many")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(26,48,64,0.15)", background: "transparent", color: "#1A3040", fontSize: 22, lineHeight: 1, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {/* Schnitt */}
        {reviews.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "24px", borderBottom: "1px solid rgba(26,48,64,0.12)" }}>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#1A3040", lineHeight: 1 }}>{avg.toFixed(1)}</span>
            <div>
              <StaticStars value={avg} size={18} />
              <p style={{ fontSize: "12px", color: "rgba(26,48,64,0.55)", marginTop: "6px" }}>
                {reviews.length} {reviews.length === 1 ? t("count_one") : t("count_many")}
              </p>
            </div>
          </div>
        )}

        {/* Dank / Formular / Knopf */}
        <div style={{ padding: "24px 0" }}>
          {submitted ? (
            <div style={{ border: "1px solid rgba(26,48,64,0.1)", borderRadius: "12px", padding: "28px", textAlign: "center", background: "#FFFFFF" }}>
              <div style={{ fontSize: "28px", color: "#D4AF37", marginBottom: "12px" }}>★</div>
              <p style={{ fontSize: "14px", color: "#1A3040", fontWeight: 600, marginBottom: "6px" }}>{t("thanks")}</p>
              <p style={{ fontSize: "12px", color: "rgba(26,48,64,0.5)" }}>{t("submitted")}</p>
            </div>
          ) : showForm ? (
            <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "24px", border: "1px solid rgba(26,48,64,0.08)" }}>
              <h3 style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: "rgba(26,48,64,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: token ? "16px" : "24px" }}>
                {t("form_title")}
              </h3>

              {/* Über den Link aus der Bewertungs-Mail gekommen */}
              {token && (
                <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#1A3040", background: "rgba(0,180,197,0.08)", border: "1px solid rgba(0,180,197,0.25)", borderRadius: "8px", padding: "12px 14px", marginBottom: "24px" }}>
                  ✓ {t("verified_hint")}
                </p>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>
                    {t("name_label")}
                    <span style={{ marginLeft: "6px", fontSize: "9px", color: "rgba(26,48,64,0.35)", letterSpacing: "0.1em" }}>— {t("name_optional")}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("name_placeholder")}
                    style={inputStyle(false)}
                    onFocus={(e) => (e.target.style.borderColor = "#1A3040")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(26,48,64,0.15)")}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{t("rating_label")}</label>
                  <Stars value={rating} onChange={setRating} />
                  {error === "rating" && <p style={{ fontSize: "11px", color: "#C0392B", marginTop: "6px" }}>{t("error_rating")}</p>}
                </div>

                <div>
                  <label style={labelStyle}>{t("comment_label")}</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("comment_placeholder")}
                    rows={4}
                    style={{ ...inputStyle(error === "comment"), resize: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "#1A3040")}
                    onBlur={(e) => (e.target.style.borderColor = error === "comment" ? "#C0392B" : "rgba(26,48,64,0.15)")}
                  />
                  {error === "comment" && <p style={{ fontSize: "11px", color: "#C0392B", marginTop: "6px" }}>{t("error_comment")}</p>}
                </div>

                {error === "submit" && <p style={{ fontSize: "11px", color: "#C0392B" }}>{t("error_submit")}</p>}
                {error === "duplicate" && <p style={{ fontSize: "11px", color: "#C0392B" }}>{t("error_duplicate")}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "14px", background: "#1A3040", color: "#F8F3E8", border: "none",
                    borderRadius: "9999px", fontSize: "12px", fontFamily: "var(--font-geist-mono)", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? t("submitting") : t("submit")}
                </button>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFormWanted(true)}
              style={{
                width: "100%", padding: "14px", background: "transparent", color: "#1A3040",
                border: "1.5px solid #1A3040", borderRadius: "9999px", fontSize: "12px",
                fontFamily: "var(--font-geist-mono)", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", cursor: "pointer",
              }}
            >
              {t("form_title")}
            </button>
          )}
        </div>

        {/* Liste */}
        <div>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} locale={locale} verifiedLabel={t("verified")} />
          ))}
        </div>
      </div>
    </div>
  );
}
