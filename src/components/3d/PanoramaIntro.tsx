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
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [loading, setLoading] = useState(true);

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
      viewer.on("load", () => { if (!destroyed) setLoading(false); });

      /* 4. Stop rotation on user drag */
      const stop = () => viewer.stopAutoRotate();
      containerRef.current.addEventListener("mousedown", stop);
      containerRef.current.addEventListener("touchstart", stop, { passive: true });
    };

    init();
    return () => { destroyed = true; viewerRef.current?.destroy(); };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
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
      `}</style>

      {/* Pannellum mount */}
      <div
        ref={containerRef}
        id="pano-mount"
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      />

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
