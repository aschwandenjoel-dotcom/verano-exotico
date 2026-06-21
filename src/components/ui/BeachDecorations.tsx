"use client";

import { useEffect } from "react";

/* ── Parallax scroll hook ───────────────────────────────────────── */
export function useParallax() {
  useEffect(() => {
    const raf = { id: 0 };
    const tick = () => {
      const sy = window.scrollY;
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const f = parseFloat(el.dataset.parallax ?? "0.25");
        el.style.transform = `translateY(${sy * f}px)`;
      });
      raf.id = requestAnimationFrame(tick);
    };
    raf.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.id);
  }, []);
}

/* ── Palm frond shadow ──────────────────────────────────────────── */
export function PalmShadow({
  style,
  parallax = 0.18,
}: {
  style?: React.CSSProperties;
  parallax?: number;
}) {
  return (
    <svg
      data-parallax={parallax}
      viewBox="0 0 520 640"
      fill="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        pointerEvents: "none",
        willChange: "transform",
        ...style,
      }}
    >
      {/* Central trunk shadow */}
      <path
        d="M280 620 Q278 520 275 400 Q272 300 270 200"
        stroke="#1A3040"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.07"
      />
      {/* Frond 1 – sweeps upper-left */}
      <path
        d="M270,200 Q200,140 100,60 Q140,120 190,175 Q228,195 270,200Z"
        fill="#1A3040"
        opacity="0.07"
      />
      <path
        d="M270,200 Q195,135 90,50 Q95,70 115,95 Q165,155 240,192 Q255,197 270,200Z"
        fill="#1A3040"
        opacity="0.04"
      />
      {/* Frond 2 – upper-right */}
      <path
        d="M270,200 Q360,140 460,70 Q420,130 370,178 Q314,197 270,200Z"
        fill="#1A3040"
        opacity="0.07"
      />
      <path
        d="M270,200 Q380,150 490,80 Q480,100 460,120 Q400,165 300,194 Q282,199 270,200Z"
        fill="#1A3040"
        opacity="0.04"
      />
      {/* Frond 3 – horizontal right */}
      <path
        d="M270,200 Q380,185 510,195 Q420,202 330,205 Q296,204 270,200Z"
        fill="#1A3040"
        opacity="0.06"
      />
      {/* Frond 4 – horizontal left */}
      <path
        d="M270,200 Q160,188 20,195 Q110,203 210,205 Q244,204 270,200Z"
        fill="#1A3040"
        opacity="0.06"
      />
      {/* Frond 5 – drooping right */}
      <path
        d="M270,200 Q360,240 480,300 Q400,260 330,230 Q296,214 270,200Z"
        fill="#1A3040"
        opacity="0.05"
      />
    </svg>
  );
}

/* ── Lounge chair ───────────────────────────────────────────────── */
export function LoungeChair({
  style,
  parallax = 0.12,
}: {
  style?: React.CSSProperties;
  parallax?: number;
}) {
  return (
    <svg
      data-parallax={parallax}
      viewBox="0 0 340 200"
      fill="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        pointerEvents: "none",
        willChange: "transform",
        ...style,
      }}
    >
      <g opacity="0.18">
        {/* Chair back (reclined ~30°) */}
        <path
          d="M40,170 L260,75"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Seat */}
        <path
          d="M40,170 L295,170"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Leg support – front pair */}
        <path
          d="M295,170 L295,196"
          stroke="#D4AF37"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M255,170 L252,196"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Leg support – back pair */}
        <path
          d="M60,170 L58,196"
          stroke="#D4AF37"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M100,170 L98,196"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Armrests */}
        <path
          d="M40,170 L38,148 Q42,144 60,140"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M295,170 L297,148 Q293,144 275,140"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Headrest cushion */}
        <ellipse
          cx="262"
          cy="72"
          rx="22"
          ry="9"
          fill="#D4AF37"
          opacity="0.25"
        />
        {/* Fabric / towel stripes on seat */}
        <path
          d="M90,165 L125,80"
          stroke="#00B4C5"
          strokeWidth="10"
          strokeOpacity="0.06"
          strokeLinecap="round"
        />
        <path
          d="M135,166 L168,83"
          stroke="#F8F3E8"
          strokeWidth="10"
          strokeOpacity="0.06"
          strokeLinecap="round"
        />
        <path
          d="M180,166 L210,86"
          stroke="#00B4C5"
          strokeWidth="10"
          strokeOpacity="0.06"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/* ── Beach umbrella ─────────────────────────────────────────────── */
export function BeachUmbrella({
  style,
  parallax = 0.1,
}: {
  style?: React.CSSProperties;
  parallax?: number;
}) {
  return (
    <svg
      data-parallax={parallax}
      viewBox="0 0 220 300"
      fill="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        pointerEvents: "none",
        willChange: "transform",
        ...style,
      }}
    >
      <g opacity="0.16">
        {/* Canopy segments */}
        <path
          d="M110,30 Q60,70 28,130 Q68,90 110,105Z"
          fill="#00B4C5"
        />
        <path
          d="M110,30 Q110,78 110,105 Q152,90 192,130Z"
          fill="#F8F3E8"
        />
        <path
          d="M110,30 Q160,70 192,130 Q155,150 110,155Z"
          fill="#00B4C5"
        />
        <path
          d="M110,30 Q110,100 110,155 Q65,150 28,130Z"
          fill="#F8F3E8"
        />
        {/* Canopy rim */}
        <ellipse
          cx="110"
          cy="132"
          rx="84"
          ry="22"
          stroke="#D4AF37"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        {/* Ribs */}
        {[30, 90, 150, 210, 270, 330].map((deg, i) => (
          <line
            key={i}
            x1="110"
            y1="80"
            x2={110 + 84 * Math.cos((deg * Math.PI) / 180)}
            y2={132 + 22 * Math.sin((deg * Math.PI) / 180)}
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.35"
          />
        ))}
        {/* Pole */}
        <line
          x1="110"
          y1="105"
          x2="110"
          y2="296"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Base cross */}
        <path
          d="M85,292 L135,292 M110,285 L110,300"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Top spike */}
        <path
          d="M110,30 L110,18"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="110" cy="15" r="4" fill="#D4AF37" opacity="0.5" />
      </g>
    </svg>
  );
}

/* ── Coconut decoration ─────────────────────────────────────────── */
export function CoconutAccent({
  style,
  parallax = 0.08,
}: {
  style?: React.CSSProperties;
  parallax?: number;
}) {
  return (
    <svg
      data-parallax={parallax}
      viewBox="0 0 120 120"
      aria-hidden="true"
      style={{
        position: "absolute",
        pointerEvents: "none",
        willChange: "transform",
        opacity: 0.13,
        ...style,
      }}
    >
      <circle cx="60" cy="65" r="32" fill="#2E7D5E" />
      <ellipse cx="60" cy="65" rx="20" ry="28" fill="#1A3040" opacity="0.4" />
      <path
        d="M60,33 Q42,18 22,10 Q38,22 52,36"
        stroke="#2E7D5E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M60,33 Q78,18 98,10 Q82,22 68,36"
        stroke="#2E7D5E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M60,33 Q50,14 50,0 Q54,18 58,32"
        stroke="#2E7D5E"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Sunset scene (footer hero) ─────────────────────────────────── */
export function SunsetScene() {
  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        lineHeight: 0,
        position: "relative",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A1530" />
            <stop offset="25%" stopColor="#6B2060" />
            <stop offset="48%" stopColor="#C04535" />
            <stop offset="65%" stopColor="#E07030" />
            <stop offset="78%" stopColor="#E8A830" />
            <stop offset="90%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#E8C97A" />
          </linearGradient>
          <linearGradient id="sg-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C06030" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#0A3D52" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#061E2A" />
          </linearGradient>
          <radialGradient id="sg-sun-glow" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#FFD060" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#F08030" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F08030" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sg-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF0A0" />
            <stop offset="50%" stopColor="#FFD040" />
            <stop offset="100%" stopColor="#F09020" />
          </radialGradient>
          <filter id="sg-blur">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Sky */}
        <rect width="1440" height="290" fill="url(#sg-sky)" />

        {/* Sun glow halo */}
        <ellipse
          cx="720"
          cy="290"
          rx="260"
          ry="120"
          fill="url(#sg-sun-glow)"
          filter="url(#sg-blur)"
        />

        {/* Sun disk (half sunk) */}
        <clipPath id="sg-horizon-clip">
          <rect x="0" y="0" width="1440" height="290" />
        </clipPath>
        <circle
          cx="720"
          cy="286"
          r="58"
          fill="url(#sg-sun)"
          clipPath="url(#sg-horizon-clip)"
        />
        {/* Sun shimmer lines */}
        <line
          x1="720"
          y1="220"
          x2="720"
          y2="200"
          stroke="#FFE080"
          strokeWidth="2"
          opacity="0.4"
        />
        <line
          x1="760"
          y1="228"
          x2="775"
          y2="212"
          stroke="#FFE080"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <line
          x1="680"
          y1="228"
          x2="665"
          y2="212"
          stroke="#FFE080"
          strokeWidth="1.5"
          opacity="0.3"
        />

        {/* Thin cloud streaks */}
        <path
          d="M200,140 Q400,125 600,138"
          stroke="rgba(255,200,120,0.2)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M800,120 Q1000,108 1200,118"
          stroke="rgba(255,200,120,0.15)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M100,180 Q300,168 500,178"
          stroke="rgba(255,180,100,0.12)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M920,165 Q1100,155 1340,162"
          stroke="rgba(255,180,100,0.12)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />

        {/* Horizon line */}
        <line
          x1="0"
          y1="290"
          x2="1440"
          y2="290"
          stroke="#D4AF37"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Water */}
        <rect x="0" y="290" width="1440" height="130" fill="url(#sg-water)" />

        {/* Water reflection – sun path */}
        <path
          d="M660,290 L680,420 L760,420 L780,290 Q750,296 720,296 Q690,296 660,290Z"
          fill="rgba(255,210,60,0.12)"
        />
        {/* Reflection glitter */}
        <ellipse cx="720" cy="308" rx="55" ry="8" fill="#FFD060" opacity="0.22" />
        <ellipse cx="720" cy="326" rx="40" ry="6" fill="#FFD060" opacity="0.15" />
        <ellipse cx="720" cy="344" rx="28" ry="5" fill="#FFD060" opacity="0.1" />
        <ellipse cx="720" cy="360" rx="18" ry="4" fill="#FFD060" opacity="0.07" />

        {/* Water ripple lines */}
        <path
          d="M0,305 Q180,295 360,305 Q540,315 720,305 Q900,295 1080,305 Q1260,315 1440,305"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M0,322 Q200,312 400,322 Q600,332 800,322 Q1000,312 1200,322 Q1360,330 1440,322"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M0,340 Q220,332 440,340 Q660,348 880,340 Q1100,332 1440,340"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          fill="none"
        />

        {/* === LEFT PALM TREE === */}
        {/* Trunk */}
        <path
          d="M95,420 Q102,360 108,290 Q112,240 115,210"
          stroke="#0A1A10"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        {/* Fronds left palm */}
        <path
          d="M115,210 Q70,165 18,135 Q55,170 88,198 Q103,207 115,210Z"
          fill="#0D2010"
        />
        <path
          d="M115,210 Q165,158 208,128 Q174,168 140,196 Q126,206 115,210Z"
          fill="#0D2010"
        />
        <path
          d="M115,210 Q62,195 8,195 Q58,202 98,206 Q108,208 115,210Z"
          fill="#0D2010"
        />
        <path
          d="M115,210 Q122,158 120,122 Q118,162 116,192 L115,210Z"
          fill="#0D2010"
        />
        <path
          d="M115,210 Q88,235 48,258 Q78,238 104,220 Q111,215 115,210Z"
          fill="#0D2010"
        />

        {/* === RIGHT PALM TREE === */}
        <path
          d="M1345,420 Q1338,355 1330,290 Q1325,245 1322,215"
          stroke="#0A1A10"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        {/* Fronds right palm */}
        <path
          d="M1322,215 Q1278,168 1230,138 Q1268,174 1300,202 Q1313,210 1322,215Z"
          fill="#0D2010"
        />
        <path
          d="M1322,215 Q1374,162 1420,132 Q1386,170 1350,200 Q1334,209 1322,215Z"
          fill="#0D2010"
        />
        <path
          d="M1322,215 Q1380,200 1436,198 Q1385,205 1345,210 Q1332,212 1322,215Z"
          fill="#0D2010"
        />
        <path
          d="M1322,215 Q1318,162 1320,126 Q1320,168 1321,198 L1322,215Z"
          fill="#0D2010"
        />
        <path
          d="M1322,215 Q1352,238 1392,258 Q1362,238 1336,222 Q1328,218 1322,215Z"
          fill="#0D2010"
        />

        {/* === SMALL LEFT PALM === */}
        <path
          d="M210,420 Q215,380 218,330 Q220,300 221,280"
          stroke="#0A1A10"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M221,280 Q192,255 162,238 Q185,258 208,274 Q216,278 221,280Z"
          fill="#0D2010"
        />
        <path
          d="M221,280 Q250,252 278,235 Q256,257 232,272 Q226,277 221,280Z"
          fill="#0D2010"
        />
        <path
          d="M221,280 Q188,274 155,273 Q188,277 212,279 L221,280Z"
          fill="#0D2010"
        />
        <path
          d="M221,280 Q225,252 224,228 Q223,255 222,272 L221,280Z"
          fill="#0D2010"
        />

        {/* Birds */}
        <path
          d="M340,155 Q346,148 352,155 Q358,162 364,155"
          stroke="#0A1A10"
          strokeWidth="1.5"
          fill="none"
          opacity="0.35"
        />
        <path
          d="M380,138 Q386,131 392,138 Q398,145 404,138"
          stroke="#0A1A10"
          strokeWidth="1.5"
          fill="none"
          opacity="0.28"
        />
        <path
          d="M1020,142 Q1026,135 1032,142 Q1038,149 1044,142"
          stroke="#0A1A10"
          strokeWidth="1.5"
          fill="none"
          opacity="0.32"
        />
        <path
          d="M1080,125 Q1086,118 1092,125 Q1098,132 1104,125"
          stroke="#0A1A10"
          strokeWidth="1.5"
          fill="none"
          opacity="0.25"
        />

        {/* Faint horizon silhouette island */}
        <path
          d="M580,288 Q620,278 660,282 Q680,283 700,285 Q720,286 740,285 Q760,283 780,282 Q820,278 860,288"
          fill="#0A1A10"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}
