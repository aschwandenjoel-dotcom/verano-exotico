"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AiBadge from "@/components/ui/AiBadge";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".about-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
      (el as HTMLElement).style.transform = "translateY(32px)";
      (el as HTMLElement).style.transition = "opacity 0.85s ease, transform 0.85s ease";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
}

export default function BrandStory() {
  useReveal();
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";
  const t = useTranslations("about");

  return (
    <div style={{ background: "#F8F3E8", color: "#1A3040" }}>

      {/* ── EINSTIEG + VISION: Text links, Bild rechts (bleibt beim Scrollen stehen) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 items-start">
        <div style={{ padding: "clamp(3rem, 6vw, 6rem) clamp(1.5rem, 5vw, 5rem)" }}>
          {/* Wo die Sonne nie untergeht */}
          <p
            className="about-reveal"
            style={{
              color: "#B8922A",
              fontSize: "10px",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono)",
              marginBottom: "2rem",
            }}
          >
            {t("eyebrow")}
          </p>
          <h1
            className="about-reveal"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.6rem, 5.2vw, 5rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#1A3040",
              marginBottom: "2rem",
            }}
          >
            {t("hero_l1")}<br />{t("hero_l2")}<br />
            <span style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#D4AF37", textTransform: "none", letterSpacing: "-0.02em" }}>
              {t("hero_accent")}
            </span>
          </h1>
          <div className="about-reveal" style={{ width: "48px", height: "1px", background: "linear-gradient(to right, #D4AF37, transparent)", marginBottom: "1.75rem" }} />
          <p
            className="about-reveal"
            style={{ color: "rgba(26,48,64,0.7)", fontSize: "0.95rem", fontFamily: "var(--font-syne)", maxWidth: "460px", lineHeight: 1.85 }}
          >
            {t("hero_body")}
          </p>

          {/* Ein Moment. Eine Idee. */}
          <p
            className="about-reveal"
            style={{
              color: "#00B4C5",
              fontSize: "10px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono)",
              margin: "clamp(3.5rem, 7vw, 5.5rem) 0 1.5rem",
            }}
          >
            {t("vision_eyebrow")}
          </p>
          <h2
            className="about-reveal"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1.8rem, 3.6vw, 3.2rem)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              color: "#1A3040",
              marginBottom: "1.75rem",
            }}
          >
            {t("vision_title")}<br />
            <span style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontWeight: 400, color: "#00B4C5", textTransform: "none" }}>
              {t("vision_accent")}
            </span>
          </h2>
          <div
            className="about-reveal"
            style={{ fontFamily: "var(--font-syne)", fontSize: "0.95rem", lineHeight: 1.9, color: "rgba(26,48,64,0.7)", maxWidth: "480px" }}
          >
            <p style={{ marginBottom: "1.25rem" }}>{t("vision_p1")}</p>
            <p style={{ marginBottom: "1.25rem" }}>{t("vision_p2")}</p>
            <p>
              {t("vision_p3_pre")}
              <em style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "#1A3040" }}>{t("vision_p3_em")}</em>
              {t("vision_p3_post")}
            </p>
          </div>
        </div>

        {/* Bild im eigenen Seitenverhältnis; auf dem Desktop bleibt es unter dem Header stehen */}
        <div className="relative md:sticky md:top-[72px]" style={{ aspectRatio: "1856 / 2304", overflow: "hidden" }}>
          <Image src="/images/about/vision.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover", objectPosition: "center top" }} priority />
          <AiBadge inset={14} />
        </div>
      </section>

      {/* ── DAS VERSPRECHEN ───────────────────────────────────────── */}
      <section
        style={{
          background: "#F8F3E8",
          padding: "clamp(4rem, 8vw, 8rem) clamp(1.5rem, 5vw, 5rem)",
          position: "relative",
          overflow: "hidden",
          borderTop: "1px solid rgba(26,48,64,0.08)",
          borderBottom: "1px solid rgba(26,48,64,0.08)",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <p
            className="about-reveal"
            style={{
              color: "#00B4C5",
              fontSize: "10px",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono)",
              marginBottom: "2rem",
            }}
          >
            {t("promise_eyebrow")}
          </p>

          <h2
            className="about-reveal"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1.8rem, 4.5vw, 4rem)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              color: "#1A3040",
              marginBottom: "clamp(1.5rem, 3vw, 2.5rem)",
              transitionDelay: "0.1s",
            }}
          >
            {t("promise_title")}{" "}
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#00B4C5",
                textTransform: "none",
              }}
            >
              {t("promise_accent")}
            </span>
          </h2>

          <div
            className="about-reveal"
            style={{
              width: "40px",
              height: "2px",
              background: "#D4AF37",
              margin: "0 auto clamp(1.5rem, 3vw, 2.5rem)",
              transitionDelay: "0.15s",
            }}
          />

          <div
            className="about-reveal"
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(0.875rem, 1.2vw, 1rem)",
              lineHeight: 1.9,
              color: "rgba(26,48,64,0.65)",
              transitionDelay: "0.2s",
            }}
          >
            <p style={{ marginBottom: "1.25rem" }}>
              {t("promise_p1")}
            </p>
            <p>
              {t("promise_p2_pre")}
              <em
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontStyle: "italic",
                  color: "#D4AF37",
                }}
              >
                {t("promise_p2_em")}
              </em>
            </p>
          </div>
        </div>
      </section>

      {/* ── ZWEI BILDER: Stoff-Detail und Flatlay ─────────────────── */}
      <div className="grid grid-cols-2" style={{ gap: "4px" }}>
        {["/images/about/stoff-detail.jpg", "/images/about/flatlay.jpg"].map((src) => (
          <div key={src} style={{ position: "relative", aspectRatio: "4/5" }}>
            <Image src={src} alt="" fill sizes="50vw" style={{ objectFit: "cover" }} />
            <AiBadge inset={14} />
          </div>
        ))}
      </div>

      {/* ── QUALITÄT & HERKUNFT: ruhig und luxuriös – Serifentitel, drei Spalten mit Haarlinien ── */}
      <section style={{ background: "#FFFFFF", padding: "clamp(5rem, 9vw, 9rem) clamp(1.5rem, 5vw, 5rem)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="text-center" style={{ marginBottom: "clamp(3.5rem, 6vw, 6rem)" }}>
            <p
              className="about-reveal"
              style={{ color: "rgba(26,48,64,0.5)", fontSize: "10px", letterSpacing: "0.45em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono)", marginBottom: "1.5rem" }}
            >
              {t("quality_eyebrow")}
            </p>
            <h2
              className="about-reveal"
              style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontSize: "clamp(2.2rem, 4.6vw, 4rem)", lineHeight: 1.1, color: "#1A3040" }}
            >
              {t("quality_title")}{" "}
              <em style={{ fontStyle: "italic", color: "#B8922A" }}>{t("quality_accent")}</em>
            </h2>
            <div className="about-reveal" style={{ width: "40px", height: "1px", background: "#D4AF37", margin: "2rem auto 0" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {[
              { n: "I", title: t("card1_title"), body: t("card1_body") },
              { n: "II", title: t("card2_title"), body: t("card2_body") },
              { n: "III", title: t("card3_title"), body: t("card3_body") },
            ].map((item, i) => (
              <div
                key={item.n}
                className="about-reveal text-center"
                style={{
                  padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1.25rem, 3vw, 2.75rem)",
                  borderLeft: i > 0 ? "1px solid rgba(26,48,64,0.12)" : "none",
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <p style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", fontSize: "1.6rem", color: "#B8922A", marginBottom: "1.25rem" }}>
                  {item.n}.
                </p>
                <h3
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#1A3040", marginBottom: "1.25rem" }}
                >
                  {item.title}
                </h3>
                <p style={{ fontFamily: "var(--font-syne)", fontSize: "0.9rem", lineHeight: 1.9, color: "rgba(26,48,64,0.65)", maxWidth: "300px", margin: "0 auto" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING ───────────────────────────────────────────────── */}
      <section
        style={{
          background: "#EDE6DA",
          padding: "clamp(5rem, 10vw, 10rem) clamp(1.5rem, 5vw, 5rem)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Horizontal rule top */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background: "linear-gradient(to right, transparent, rgba(212,175,55,0.25), transparent)",
          }}
        />

        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p
            className="about-reveal"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1.8rem, 5vw, 4.5rem)",
              lineHeight: 1.1,
              textTransform: "uppercase",
              color: "#1A3040",
              marginBottom: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
          >
            {t("closing_l1")}
            <br />
            {t("closing_l2")}{" "}
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#D4AF37",
                textTransform: "none",
              }}
            >
              {t("closing_accent")}
            </span>
            <br />
            {t("closing_l3")}
          </p>

          <div
            className="about-reveal"
            style={{
              width: "48px",
              height: "1px",
              background: "rgba(232,201,122,0.4)",
              margin: "0 auto clamp(2rem, 4vw, 3.5rem)",
              transitionDelay: "0.1s",
            }}
          />

          <Link
            href={`/${locale}/collection`}
            className="about-reveal"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              background: "#D4AF37",
              color: "#1A3040",
              padding: "16px 32px",
              textDecoration: "none",
              transitionDelay: "0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {t("cta")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
