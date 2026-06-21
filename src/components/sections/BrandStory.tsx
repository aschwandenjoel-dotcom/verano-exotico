"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

  return (
    <div style={{ background: "#F8F3E8", color: "#1A3040" }}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#F0F8F9",
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "clamp(5rem, 10vw, 10rem) clamp(1.5rem, 5vw, 5rem) clamp(3rem, 6vw, 6rem)",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(26,48,64,0.08)",
        }}
      >
        {/* Decorative teal circle */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "clamp(300px, 50vw, 700px)",
            height: "clamp(300px, 50vw, 700px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,180,197,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: "900px" }}>
          <p
            className="about-reveal"
            style={{
              color: "#00B4C5",
              fontSize: "10px",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono)",
              marginBottom: "clamp(1rem, 3vw, 2rem)",
            }}
          >
            Über uns
          </p>

          <h1
            className="about-reveal"
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 9vw, 9rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#1A3040",
              transitionDelay: "0.1s",
            }}
          >
            Wo die Sonne
            <br />
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#00B4C5",
                textTransform: "none",
                letterSpacing: "-0.03em",
              }}
            >
              nie untergeht.
            </span>
          </h1>

          <div
            className="about-reveal"
            style={{
              width: "clamp(40px, 5vw, 64px)",
              height: "1px",
              background: "linear-gradient(to right, #D4AF37, transparent)",
              margin: "clamp(1.5rem, 3vw, 2.5rem) 0",
              transitionDelay: "0.2s",
            }}
          />

          <p
            className="about-reveal"
            style={{
              color: "rgba(26,48,64,0.55)",
              fontSize: "clamp(0.8rem, 1.2vw, 1rem)",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-syne)",
              maxWidth: "480px",
              lineHeight: 1.7,
              transitionDelay: "0.3s",
            }}
          >
            Eine Marke aus einem einzigen Augenblick geboren. Geformt von
            Atlantik-Wellen und dem Licht, das alles veränderte.
          </p>
        </div>
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
            Mar del Plata, Argentinien
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
            Ein Moment.<br />
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#00B4C5",
                textTransform: "none",
              }}
            >
              Eine Idee.
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
              Mar del Plata, Atlantikküste. Kein Plan, kein Konzept. Nur Wasser,
              Horizont und dieses Gefühl, das schwer zu beschreiben ist: wenn alles
              stimmt und man einfach nur da sein will.
            </p>
            <p style={{ marginBottom: "1.25rem" }}>
              Was unser Gründer trug, passte nicht dazu. Zu steif, zu laut, zu weit
              weg von dem, was der Moment verlangte. Wie ein falscher Ton in einem
              perfekten Lied.
            </p>
            <p>
              Auf dem Rückweg war die Idee da:{" "}
              <em style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "#1A3040" }}>
                Kleider, die sich so anfühlen, wie dieser Ort geklungen hat.
              </em>{" "}
              Nicht mehr, nicht weniger.
            </p>
          </div>
        </div>

        {/* Visual column */}
        <div
          style={{
            background: "#F0F8F9",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            padding: "clamp(3rem, 5vw, 5rem)",
            minHeight: "360px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Coordinate text */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "clamp(1.5rem, 3vw, 3rem)",
              right: "clamp(1.5rem, 3vw, 3rem)",
              textAlign: "right",
            }}
          >
            <p style={{ color: "rgba(26,48,64,0.35)", fontSize: "10px", letterSpacing: "0.3em", fontFamily: "var(--font-geist-mono)", lineHeight: 1.8 }}>
              38°00'S<br />57°33'W<br />Mar del Plata
            </p>
          </div>

          {/* Vertical color bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "200px" }}>
            {[
              { color: "#00B4C5", h: "40%" },
              { color: "#2E7D5E", h: "60%" },
              { color: "#D4AF37", h: "80%" },
              { color: "#1A3040", h: "55%" },
              { color: "#00B4C5", h: "90%" },
              { color: "transparent", h: "35%", border: "1px solid rgba(0,180,197,0.4)" },
            ].map((bar, i) => (
              <div
                key={i}
                style={{
                  width: "clamp(18px, 2vw, 28px)",
                  height: bar.h,
                  background: bar.color,
                  border: bar.border,
                  opacity: 0.75,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <p
            style={{
              position: "absolute",
              bottom: "clamp(1.5rem, 3vw, 3rem)",
              right: "clamp(1.5rem, 3vw, 3rem)",
              color: "rgba(26,48,64,0.2)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              fontFamily: "var(--font-geist-mono)",
              textTransform: "uppercase",
            }}
          >
            SS25 Origin
          </p>
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
            Unser Versprechen
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
            Wohlbefinden ist kein Feature.{" "}
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#00B4C5",
                textTransform: "none",
              }}
            >
              Es ist der Anfang.
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
              Was unser Gründer nicht selbst tragen würde, kommt nicht rein.
              Kein Kompromiss, kein "ist schon gut genug". Jedes Stück wird
              so lange geprüft, bis es sich wirklich richtig anfühlt.
            </p>
            <p>
              Dabei arbeiten wir mit Leuten zusammen, die Stoffe wirklich kennen.
              Kein Bauchgefühl gegen Fakten, sondern beides zusammen. Das Ergebnis
              sind Stücke,{" "}
              <em
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontStyle: "italic",
                  color: "#D4AF37",
                }}
              >
                die man einfach immer wieder rausholt.
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
              Qualität & Herkunft
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
              Gemacht, um zu{" "}
              <span
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#00B4C5",
                  textTransform: "none",
                }}
              >
                bleiben.
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
                title: "Handverlesene Auswahl",
                body: "Jedes Stück landet zuerst in unseren Händen. Wenn es sich nicht gut anfühlt, kommt es nicht ins Sortiment. So einfach ist das.",
                delay: "0s",
              },
              {
                eyebrow: "02",
                title: "Spezialisierte Manufakturen",
                body: "Wir arbeiten mit Herstellern, bei denen Qualität kein Marketingwort ist. Stoffe, die atmen. Nähte, die halten. Schnitte, die Raum lassen.",
                delay: "0.12s",
              },
              {
                eyebrow: "03",
                title: "Schweizer Zuverlässigkeit",
                body: "Wir sitzen in der Schweiz und sind für euch da. Fragen, Probleme, Feedback: alles direkt. Keine automatischen Antworten, keine langen Wartezeiten.",
                delay: "0.24s",
              },
            ].map((item) => (
              <div
                key={item.eyebrow}
                className="about-reveal"
                style={{
                  background: "#F8F3E8",
                  padding: "clamp(2rem, 4vw, 3.5rem)",
                  transitionDelay: item.delay,
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
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING ───────────────────────────────────────────────── */}
      <section
        style={{
          background: "#111111",
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
            Der ewige Sommer ist
            <br />
            kein Ort.{" "}
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#D4AF37",
                textTransform: "none",
              }}
            >
              Er ist eine Haltung.
            </span>
            <br />
            und er gehört dir.
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
            Kollektion entdecken
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
