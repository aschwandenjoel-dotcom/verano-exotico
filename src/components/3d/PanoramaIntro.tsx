"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Pannellum type stubs ───────────────────────────────────────── */
interface PannellumViewer {
  on: (event: string, cb: () => void) => PannellumViewer;
  destroy: () => void;
  stopAutoRotate: () => void;
}

declare global {
  interface Window {
    pannellum?: {
      viewer: (
        container: HTMLElement,
        config: Record<string, unknown>
      ) => PannellumViewer;
    };
  }
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function PanoramaIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [loading, setLoading] = useState(true);
  /* WebGL fehlt (In-App-Browser von Instagram/TikTok, Stromsparmodus, alte
     Geraete) oder das 1.9-MB-Panorama laedt nicht: Vorher blieb der Hero dann
     dauerhaft ein schwarzer Kasten mit "LOADING". Jetzt zeigt er nach einem
     Pannellum-Fehler oder 8 s ohne "load" ein statisches Strandbild. */
  const [failed, setFailed] = useState(false);

  /* Auf dem Handy: seitlich wischen dreht das Panorama, senkrecht wischen
     scrollt die Seite.

     Pannellum haengt seine Touch-Handler an den Viewer-Container und ruft dort
     preventDefault() - dadurch verschluckt es JEDE Wischgeste, auch senkrechte,
     und die Seite laesst sich nicht mehr scrollen.

     Gegenmittel in zwei Schichten:
     1. touch-action: pan-y im CSS. Damit uebernimmt der Browser senkrechtes
        Scrollen selbst und ignoriert dabei preventDefault.
     2. Dieser Handler in der CAPTURE-Phase auf der Section, also einer Ebene
        UEBER dem Viewer. Er legt nach den ersten Pixeln die Richtung fest und
        stoppt bei senkrechten Gesten die Weitergabe - so dreht sich das
        Panorama beim Scrollen nicht nebenbei ein Stueck mit. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const THRESHOLD = 8; // Pixel, bis die Richtung als erkannt gilt
    let startX = 0;
    let startY = 0;
    let axis: "x" | "y" | null = null;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        axis = "x"; // Mehrfingergesten dem Viewer ueberlassen
        return;
      }
      axis = null;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (axis === null) {
        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) {
          e.stopPropagation(); // Richtung noch offen: Viewer nicht reagieren lassen
          return;
        }
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        // Erst die bewusste waagrechte Geste beendet die Eigendrehung.
        if (axis === "x") viewerRef.current?.stopAutoRotate();
      }
      if (axis === "y") e.stopPropagation();
    };

    const onEnd = () => { axis = null; };

    const opts = { capture: true, passive: true } as const;
    el.addEventListener("touchstart", onStart, opts);
    el.addEventListener("touchmove", onMove, opts);
    el.addEventListener("touchend", onEnd, opts);
    el.addEventListener("touchcancel", onEnd, opts);
    return () => {
      el.removeEventListener("touchstart", onStart, true);
      el.removeEventListener("touchmove", onMove, true);
      el.removeEventListener("touchend", onEnd, true);
      el.removeEventListener("touchcancel", onEnd, true);
    };
  }, []);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      /* 1. Pannellum CSS */
      if (!document.querySelector('link[data-pannellum]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.setAttribute("data-pannellum", "");
        link.href =
          "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
        document.head.appendChild(link);
      }

      /* 2. Pannellum JS */
      await new Promise<void>((resolve) => {
        if (window.pannellum) { resolve(); return; }
        const s = document.createElement("script");
        s.setAttribute("data-pannellum", "");
        s.src =
          "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

      if (destroyed || !containerRef.current || !window.pannellum) return;

      /* 3. Init viewer
         Primary:  /images/panorama-360.webp  (WebP, 1.9 MB — modern browsers)
         Fallback: /images/beach-panorama.jpg (JPG — swap panorama value for Safari < 14 / IE11) */
      const viewer = window.pannellum.viewer(containerRef.current, {
        type: "equirectangular",
        panorama: "/images/panorama-360.webp",
        autoLoad: true,
        autoRotate: -2.0,
        autoRotateInactivityDelay: 1e9,
        showControls: false,
        showFullscreenCtrl: false,
        showZoomCtrl: false,
        mouseZoom: false,
        compass: false,
        hfov: 100,
        pitch: 0,
        yaw: 120,
      });

      viewerRef.current = viewer;
      viewer.on("load", () => { if (!destroyed) { setLoading(false); clearTimeout(fallbackTimer); } });
      viewer.on("error", () => { if (!destroyed) { setFailed(true); setLoading(false); clearTimeout(fallbackTimer); } });

      /* 4. Drehung bei echter Bedienung stoppen.
         Nur mousedown - NICHT touchstart: auf dem Handy loeste jede
         Beruehrung das Stoppen aus, auch eine, die bloss die Seite scrollen
         sollte. Dadurch stand das Panorama dort sofort still, waehrend es auf
         dem Laptop weiterdrehte. Fuer Touch uebernimmt das der Achsen-Handler
         weiter oben, sobald er eine waagrechte Geste erkennt. */
      containerRef.current.addEventListener("mousedown", () => viewer.stopAutoRotate());
    };

    // Sicherheitsnetz, falls weder "load" noch "error" kommt (Script-CDN
    // blockiert, Bild haengt): nach 8 s auf das Standbild wechseln.
    const fallbackTimer = setTimeout(() => {
      if (!destroyed) { setFailed(true); setLoading(false); }
    }, 8000);

    init().catch(() => { if (!destroyed) { setFailed(true); setLoading(false); } });
    return () => { destroyed = true; clearTimeout(fallbackTimer); viewerRef.current?.destroy(); };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pano-hero"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#080808",
      }}
      aria-label="360° Strand-Panorama"
    >
      <style>{`
        @keyframes pano-spin { to { transform: rotate(360deg); } }
        .pnlm-about-msg,
        .pnlm-load-button,
        .pnlm-orientation-button,
        .pnlm-controls-container { display: none !important; }
        #pano-mount { width: 100% !important; height: 100% !important; }
        #pano-mount .pnlm-container { width: 100% !important; height: 100% !important; }

        /* Pannellum setzt touch-action: none und sperrt damit das Scrollen der
           Seite. pan-y gibt senkrechte Gesten an den Browser zurueck, waehrend
           waagrechte weiterhin beim Viewer landen. Gilt auch fuer die intern
           erzeugten Kindelemente (.pnlm-dragfix, .pnlm-render-container). */
        #pano-mount,
        #pano-mount * { touch-action: pan-y !important; }

        /* 100vh rechnet auf Handys die ein- und ausblendende Browserleiste mit,
           wodurch der Abschnitt zu hoch wird. svh nimmt die kleinste Variante
           und bleibt beim Scrollen ruhig. */
        .pano-hero { height: 100vh; height: 100svh; }
      `}</style>

      {/* Pannellum mount */}
      <div
        ref={containerRef}
        id="pano-mount"
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0, visibility: failed ? "hidden" : "visible" }}
      />

      {/* Statisches Fallback statt Panorama (kein WebGL / Ladefehler) */}
      {failed && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/shop-hero-1.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 1,
          }}
        />
      )}

      {/* Loading spinner — disappears once viewer fires "load" */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(8,8,8,0.97)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: "2px solid rgba(212,175,55,0.15)",
              borderTopColor: "#D4AF37",
              borderRadius: "50%",
              animation: "pano-spin 0.85s linear infinite",
              marginBottom: 18,
            }}
          />
          <p
            style={{
              color: "rgba(242,237,228,0.35)",
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            Loading
          </p>
        </div>
      )}

      {/* Top + bottom vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* ── VERANO EXOTICO brand title ──────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          pointerEvents: "none",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {/* VERANO — gold, Archivo Black */}
        <div style={{
          fontSize: "clamp(2.8rem, 7vw, 6.5rem)",
          fontFamily: "var(--font-archivo-black), sans-serif",
          fontWeight: 900,
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#D4AF37",
          textShadow: "0 2px 32px rgba(0,0,0,0.7)",
        }}>
          VERANO
        </div>

        {/* Thin gold rule */}
        <div style={{
          width: "clamp(32px, 4vw, 64px)",
          height: 1,
          background: "linear-gradient(to right, transparent, #D4AF37, transparent)",
          margin: "12px auto",
          opacity: 0.6,
        }} />

        {/* EXOTICO — DM Serif Display italic, gold */}
        <div style={{
          fontSize: "clamp(2.4rem, 6vw, 5.5rem)",
          fontFamily: "var(--font-dm-serif)",
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "0.04em",
          color: "#D4AF37",
          textShadow: "0 2px 32px rgba(0,0,0,0.7)",
        }}>
          Exotico
        </div>

        {/* Tagline */}
        <p style={{
          color: "rgba(242,237,228,0.85)",
          fontSize: "clamp(11px, 1.3vw, 14px)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontFamily: "var(--font-geist-mono)",
          marginTop: 20,
        }}>
          Where our ideas come to life
        </p>

        {/* Scroll cue */}
        <div style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}>
          <svg width="12" height="22" viewBox="0 0 12 22" fill="none"
            style={{ animation: "scrollBounce 1.8s ease-in-out infinite" }}>
            <path d="M6 0 L6 16 M1 11 L6 16 L11 11"
              stroke="rgba(242,237,228,0.4)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <style>{`
            @keyframes scrollBounce {
              0%,100% { transform: translateY(0); opacity:.4; }
              50%      { transform: translateY(6px); opacity:.75; }
            }
            @media (prefers-reduced-motion:reduce) {
              @keyframes scrollBounce { 0%,100%{ transform:none; } }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
