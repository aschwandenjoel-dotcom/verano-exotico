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
  } catch {
    return [];
  }
}

function saveReview(review: Review) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Review[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, review]));
  } catch {
    // localStorage unavailable
  }
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;

  return (
    <div className="flex gap-1">
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
            className={[
              "text-2xl leading-none transition-colors",
              interactive ? "cursor-pointer" : "cursor-default",
              filled ? "text-amber-400" : "text-white/20",
            ].join(" ")}
            aria-label={interactive ? `${star} star` : undefined}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations("reviews");
  const date = new Date(review.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-white/10 rounded-xl p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{review.name}</span>
        <span className="text-xs font-mono text-text-muted">{date}</span>
      </div>
      <StarRating value={review.rating} />
      <p className="text-sm text-text-muted leading-relaxed">{review.comment}</p>
      <p className="text-[10px] font-mono text-text-muted/60 uppercase tracking-widest">
        {t("verified")}
      </p>
    </div>
  );
}

export default function ReviewSection({ productSlug }: { productSlug: string }) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReviews(loadReviews(productSlug));
  }, [productSlug]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) { setError("name"); return; }
      if (rating === 0) { setError("rating"); return; }
      if (!comment.trim()) { setError("comment"); return; }

      const review: Review = {
        id: crypto.randomUUID(),
        productSlug,
        name: name.trim(),
        rating,
        comment: comment.trim(),
        date: new Date().toISOString(),
      };

      saveReview(review);
      setReviews((prev) => [...prev, review]);
      setSubmitted(true);
      setName("");
      setRating(0);
      setComment("");
      setError("");
    },
    [productSlug, name, rating, comment]
  );

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="border-t border-white/10 pt-16 mt-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="flex items-baseline gap-4 mb-10">
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">
            {t("title")}
          </h2>
          {avg && (
            <span className="text-sm font-mono text-text-muted">
              ★ {avg} · {reviews.length}{" "}
              {reviews.length === 1 ? "Bewertung" : "Bewertungen"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Review list */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-text-muted">{t("no_reviews")}</p>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>

          {/* Review form */}
          <div>
            {submitted ? (
              <div className="border border-white/10 rounded-xl p-8 text-center">
                <p className="text-2xl mb-2">★</p>
                <p className="text-sm text-text-muted">{t("submitted")}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-xs font-mono text-text-muted underline underline-offset-4 hover:text-text-primary transition-colors"
                >
                  {t("form_title")} →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-sm font-mono font-bold text-text-muted uppercase tracking-widest">
                  {t("form_title")}
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
                    {t("name_label")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("name_placeholder")}
                    className={[
                      "w-full bg-surface border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/40 outline-none focus:border-white/40 transition-colors",
                      error === "name" ? "border-red-500/60" : "border-white/10",
                    ].join(" ")}
                  />
                </div>

                {/* Star rating */}
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
                    {t("rating_label")}
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                  {error === "rating" && (
                    <p className="text-xs text-red-400 mt-1">Bitte Bewertung auswählen</p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
                    {t("comment_label")}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("comment_placeholder")}
                    rows={4}
                    className={[
                      "w-full bg-surface border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/40 outline-none focus:border-white/40 transition-colors resize-none",
                      error === "comment" ? "border-red-500/60" : "border-white/10",
                    ].join(" ")}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/80 transition-colors"
                >
                  {t("submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
