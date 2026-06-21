"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Review } from "@/types";

const STORAGE_KEY = "ve_reviews";

function loadReviews(slug: string): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Review[] = raw ? JSON.parse(raw) : [];
    return all.filter((r) => r.productSlug === slug);
  } catch { return []; }
}

function saveReview(review: Review) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Review[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, review]));
  } catch {}
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

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.date).toLocaleDateString("de-CH", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div style={{
      padding: "20px 0",
      borderBottom: "1px solid rgba(26,48,64,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A3040" }}>{review.name}</span>
        <span style={{ fontSize: "11px", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)" }}>{date}</span>
      </div>
      <Stars value={review.rating} />
      <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.7)", lineHeight: 1.7, marginTop: "10px" }}>
        {review.comment}
      </p>
      <p style={{ fontSize: "10px", color: "rgba(26,48,64,0.3)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "10px" }}>
        Verifizierter Kauf
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

export default function ReviewSection({ productSlug }: { productSlug: string }) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setReviews(loadReviews(productSlug)); }, [productSlug]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0)    { setError("rating");  return; }
    if (!comment.trim()) { setError("comment"); return; }

    const review: Review = {
      id: crypto.randomUUID(),
      productSlug,
      name: name.trim() || "Anonym",
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };

    saveReview(review);
    setReviews((prev) => [...prev, review]);
    setSubmitted(true);
    setName(""); setRating(0); setComment(""); setError("");
  }, [productSlug, name, rating, comment]);

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section style={{ background: "#F8F3E8", borderTop: "1px solid rgba(26,48,64,0.08)" }}>
      <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "64px clamp(1.5rem, 5vw, 2.5rem) 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.2em", textTransform: "uppercase", color: "#00B4C5", marginBottom: "8px" }}>
            Kundenstimmen
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <h2 style={{ fontSize: "28px", fontFamily: "var(--font-archivo-black), sans-serif", fontWeight: 900, color: "#1A3040", textTransform: "uppercase", letterSpacing: "-0.01em", margin: 0 }}>
              {t("title")}
            </h2>
            {avg && (
              <span style={{ fontSize: "13px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.45)" }}>
                ★ {avg} · {reviews.length} {reviews.length === 1 ? "Bewertung" : "Bewertungen"}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: "64px" }} className="grid-cols-1 lg:grid-cols-2">
          <>

            {/* Review list */}
            <div>
              {reviews.length === 0 ? (
                <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.4)", paddingTop: "20px" }}>
                  {t("no_reviews")}
                </p>
              ) : (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div style={{ border: "1px solid rgba(26,48,64,0.1)", borderRadius: "12px", padding: "40px", textAlign: "center", background: "#FFFFFF" }}>
                  <div style={{ fontSize: "28px", color: "#D4AF37", marginBottom: "12px" }}>★</div>
                  <p style={{ fontSize: "14px", color: "#1A3040", fontWeight: 600, marginBottom: "6px" }}>Danke für deine Bewertung!</p>
                  <p style={{ fontSize: "12px", color: "rgba(26,48,64,0.5)" }}>{t("submitted")}</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    style={{ marginTop: "24px", fontSize: "11px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.5)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", letterSpacing: "0.1em" }}
                  >
                    Weitere Bewertung →
                  </button>
                </div>
              ) : (
                <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "32px", border: "1px solid rgba(26,48,64,0.08)" }}>
                  <h3 style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: "rgba(26,48,64,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "28px" }}>
                    {t("form_title")}
                  </h3>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label style={labelStyle}>
                        {t("name_label")}
                        <span style={{ marginLeft: "6px", fontSize: "9px", color: "rgba(26,48,64,0.35)", letterSpacing: "0.1em" }}>— optional</span>
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
                      {error === "rating" && (
                        <p style={{ fontSize: "11px", color: "#C0392B", marginTop: "6px" }}>Bitte Bewertung auswählen</p>
                      )}
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
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: "#1A3040",
                        color: "#F8F3E8",
                        border: "none",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      {t("submit")}
                    </button>
                  </form>
                </div>
              )}
            </div>

          </>
        </div>
      </div>
    </section>
  );
}
