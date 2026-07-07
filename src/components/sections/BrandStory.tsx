"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div style={{ background: "#F8F3E8", color: "#1A3040" }}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#243d52",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "clamp(7rem, 12vw, 11rem) clamp(2rem, 6vw, 7rem) clamp(4rem, 7vw, 7rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gold radial glow bottom-left */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 10% 90%, rgba(212,175,55,0.08) 0%, transparent 55%)",
          pointerEvents: "none",
        }}/>

        {/* ÜBER UNS — large eyebrow */}
        <p
          className="about-reveal"
          style={{
            color: "#D4AF37",
            fontSize: "clamp(0.65rem, 1.1vw, 0.85rem)",
            letterSpacing: "0.55em",
            textTransform: "uppercase",
            fontFamily: "var(--font-geist-mono)",
            marginBottom: "clamp(2rem, 4vw, 3.5rem)",
          }}
        >
          {t("eyebrow")}
        </p>

        <h1
          className="about-reveal"
          style={{
            fontFamily: "var(--font-archivo-black), sans-serif",
            fontWeight: 900,
            fontSize: "clamp(3.5rem, 9vw, 10rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            color: "#F8F3E8",
            marginBottom: "clamp(2rem, 4vw, 3.5rem)",
            transitionDelay: "0.1s",
          }}
        >
          {t("hero_l1")}<br />{t("hero_l2")}<br />
          <span style={{
            fontFamily: "var(--font-dm-serif)",
            fontStyle: "italic",
            fontWeight: 400,
            color: "#D4AF37",
            textTransform: "none",
            letterSpacing: "-0.02em",
          }}>
            {t("hero_accent")}
          </span>
        </h1>

        {/* Gold rule */}
        <div className="about-reveal" style={{
          width: "48px", height: "1px",
          background: "linear-gradient(to right, #D4AF37, transparent)",
          marginBottom: "clamp(1.5rem, 3vw, 2.5rem)",
          transitionDelay: "0.2s",
        }}/>

        <p
          className="about-reveal"
          style={{
            color: "rgba(248,243,232,0.45)",
            fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)",
            letterSpacing: "0.04em",
            fontFamily: "var(--font-syne)",
            maxWidth: "440px",
            lineHeight: 1.85,
            transitionDelay: "0.3s",
          }}
        >
          {t("hero_body")}
        </p>

        {/* Bottom-right: SS25 index */}
        <p aria-hidden="true" style={{
          position: "absolute",
          bottom: "clamp(2rem, 4vw, 3.5rem)",
          right: "clamp(2rem, 6vw, 7rem)",
          color: "rgba(248,243,232,0.12)",
          fontSize: "9px",
          letterSpacing: "0.45em",
          fontFamily: "var(--font-geist-mono)",
          textTransform: "uppercase",
        }}>
          {`SS${String(new Date().getFullYear()).slice(2)}`}
        </p>
      </section>

      {/* ── DIE VISION ────────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
          minHeight: "clamp(500px, 60vh, 700px)",
        }}
      >
        {/* Text column */}
        <div
          style={{
            padding: "clamp(3rem, 7vw, 7rem) clamp(1.5rem, 5vw, 5rem)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "#F8F3E8",
          }}
        >
          <p
            className="about-reveal"
            style={{
              color: "#00B4C5",
              fontSize: "10px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono)",
              marginBottom: "2rem",
            }}
          >
            {t("vision_eyebrow")}
          </p>

          <h2
            className="about-reveal"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1.8rem, 4vw, 3.5rem)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              color: "#1A3040",
              marginBottom: "2rem",
              transitionDelay: "0.1s",
            }}
          >
            {t("vision_title")}<br />
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#00B4C5",
                textTransform: "none",
              }}
            >
              {t("vision_accent")}
            </span>
          </h2>

          <div
            className="about-reveal"
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)",
              lineHeight: 1.9,
              color: "rgba(26,48,64,0.7)",
              maxWidth: "480px",
              transitionDelay: "0.2s",
            }}
          >
            <p style={{ marginBottom: "1.25rem" }}>
              {t("vision_p1")}
            </p>
            <p style={{ marginBottom: "1.25rem" }}>
              {t("vision_p2")}
            </p>
            <p>
              {t("vision_p3_pre")}
              <em style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "#1A3040" }}>
                {t("vision_p3_em")}
              </em>
              {t("vision_p3_post")}
            </p>
          </div>
        </div>

        {/* Visual column */}
        <div
          style={{
            position: "relative",
            minHeight: "360px",
            overflow: "hidden",
          }}
        >
          <img
            src="/images/brand-logo.png"
            alt="Verano Exotico Logo"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
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

      {/* ── QUALITÄT & HERKUNFT ───────────────────────────────────── */}
      <section
        style={{
          background: "#F8F3E8",
          padding: "clamp(4rem, 8vw, 8rem) clamp(1.5rem, 5vw, 5rem)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ marginBottom: "clamp(2.5rem, 5vw, 5rem)" }}>
            <p
              className="about-reveal"
              style={{
                color: "#00B4C5",
                fontSize: "10px",
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                fontFamily: "var(--font-geist-mono)",
                marginBottom: "1rem",
              }}
            >
              {t("quality_eyebrow")}
            </p>
            <h2
              className="about-reveal"
              style={{
                fontFamily: "var(--font-archivo-black), sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.8rem, 4vw, 3.5rem)",
                textTransform: "uppercase",
                lineHeight: 1.05,
                color: "#1A3040",
                transitionDelay: "0.1s",
              }}
            >
              {t("quality_title")}{" "}
              <span
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#00B4C5",
                  textTransform: "none",
                }}
              >
                {t("quality_accent")}
              </span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "1px",
              background: "rgba(26,48,64,0.1)",
            }}
          >
            {[
              {
                eyebrow: "01",
                title: t("card1_title"),
                body: t("card1_body"),
                delay: "0s",
              },
              {
                eyebrow: "02",
                title: t("card2_title"),
                body: t("card2_body"),
                delay: "0.12s",
              },
              {
                eyebrow: "03",
                title: t("card3_title"),
                body: t("card3_body"),
                delay: "0.24s",
              },
            ].map((item) => {
              const isHovered = hoveredCard === item.eyebrow;
              return (
              <div
                key={item.eyebrow}
                className="about-reveal"
                onMouseEnter={() => setHoveredCard(item.eyebrow)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "#F8F3E8",
                  padding: "clamp(2rem, 4vw, 3.5rem)",
                  transitionDelay: item.delay,
                  cursor: "default",
                  transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s cubic-bezier(0.23,1,0.32,1)",
                  transform: isHovered
                    ? "perspective(600px) translateY(-10px) translateZ(18px) scale(1.025)"
                    : "perspective(600px) translateY(0) translateZ(0) scale(1)",
                  boxShadow: isHovered
                    ? "0 20px 50px rgba(26,48,64,0.15), 0 6px 16px rgba(26,48,64,0.08)"
                    : "none",
                  position: "relative",
                  zIndex: isHovered ? 2 : 0,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "2px",
                    background: "#00B4C5",
                    marginBottom: "2rem",
                  }}
                />
                <p
                  style={{
                    color: "rgba(26,48,64,0.3)",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    fontFamily: "var(--font-geist-mono)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {item.eyebrow}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-archivo-black), sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#1A3040",
                    marginBottom: "1rem",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "0.85rem",
                    lineHeight: 1.85,
                    color: "rgba(26,48,64,0.65)",
                  }}
                >
                  {item.body}
                </p>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* ── CLOSING ───────────────────────────────────────────────── */}
      <section
        style={{
          background: "#243d52",
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
              color: "#F8F3E8",
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
