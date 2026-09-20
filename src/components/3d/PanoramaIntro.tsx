"use client";

/**
 * Strand-Panorama als Intro - ohne WebGL.
 *
 * Bis 20.09.2026 lief hier Pannellum (WebGL-360°-Viewer mit Eigendrehung).
 * Chrome auf macOS blieb damit sporadisch mit "Seite reagiert nicht" haengen:
 * Der GPU-Prozess blockierte beim laufenden Rendern (in Tests 2 von 3 Laeufen,
 * unabhaengig von der Texturgroesse, auch in einem frischen Profil ohne
 * Erweiterungen). Der Debugger konnte JavaScript dabei nicht unterbrechen -
 * es war also keine Schleife im Code, sondern der Renderer wartete auf die
 * Grafikkarte. Messprotokoll: siehe Commit-Text dieser Aenderung.
 *
 * Jetzt: Das 360°-Bild wird als horizontaler Streifen gezeigt und per
 * CSS-Transform langsam durchgeschoben. Weil ein Equirectangular-Bild
 * horizontal umlaeuft, ist der Loop nahtlos: zwei Kopien nebeneinander,
 * Verschiebung um genau eine Bildbreite. Kostet die GPU so gut wie nichts
 * (eine Compositor-Ebene, kein WebGL-Kontext) und funktioniert auch in
 * In-App-Browsern ohne WebGL.
 */
export default function PanoramaIntro() {
  return (
    <section
      className="pano-hero"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#0A3D52",
      }}
      aria-label="Strand-Panorama"
    >
      <style>{`
        /* 100vh rechnet auf Handys die ein- und ausblendende Browserleiste mit,
           wodurch der Abschnitt zu hoch wird. svh nimmt die kleinste Variante
           und bleibt beim Scrollen ruhig. */
        .pano-hero { height: 100vh; height: 100svh; }

        /* Zwei Kopien des Streifens nebeneinander; der Track wandert um genau
           eine Kopie nach links und springt dann unsichtbar zurueck. */
        .pano-track {
          position: absolute;
          inset: 0 auto 0 0;
          height: 100%;
          display: flex;
          width: max-content;
          will-change: transform;
          animation: pano-pan 150s linear infinite;
        }
        .pano-track img {
          height: 100%;
          width: auto;
          display: block;
          flex: none;
          user-select: none;
          -webkit-user-drag: none;
        }
        @keyframes pano-pan {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pano-track { animation: none; }
        }
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0); opacity: .4; }
          50%     { transform: translateY(6px); opacity: .75; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes scrollBounce { 0%,100% { transform: none; } }
        }
      `}</style>

      {/* Panorama-Streifen (zweimal fuer den nahtlosen Loop). Bewusst ein
          normales <img> statt next/image: die Datei ist bereits WebP in der
          einen Groesse, die gebraucht wird - jede weitere Variante wuerde nur
          das Transformations-Kontingent bei Vercel belasten. */}
      <div className="pano-track" aria-hidden="true">
        {[0, 1].map((i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src="/images/panorama-strip.webp"
            alt=""
            decoding="async"
            fetchPriority={i === 0 ? "high" : "low"}
          />
        ))}
      </div>

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
        </div>
      </div>
    </section>
  );
}
