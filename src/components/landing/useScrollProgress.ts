"use client";

import { useEffect } from "react";

/**
 * Scrollgetriebene Animationen ohne Bibliothek.
 *
 * Ein einziger, per requestAnimationFrame gedrosselter Scroll-Listener setzt
 * auf jedem Element mit `data-scroll` die CSS-Variable `--p` (0 … 1). Wie
 * `--p` in Bewegung uebersetzt wird (Parallax, Aufsteigen, Farbwechsel), steht
 * ausschliesslich im CSS (globals.css, Abschnitt "Scroll-driven"). So bleibt
 * der Haupt-Thread frei: pro Frame nur getBoundingClientRect + setProperty.
 *
 * Modi (Wert des Attributs):
 *   - "view" (Standard): 0, sobald die Oberkante unten in den Viewport kommt,
 *                        1, wenn die Unterkante oben verschwunden ist.
 *   - "pin":  fuer angepinnte Sektionen (position: sticky im Kind). 0, solange
 *             die Sektion noch nicht am oberen Rand klebt, 1, wenn ihr Ende
 *             erreicht ist - also der Fortschritt innerhalb der Pin-Strecke.
 *   - "top":  fuer den Hero: 0 am Seitenanfang, 1 nach einer Viewport-Hoehe.
 *
 * Respektiert prefers-reduced-motion: dann wird nichts gesetzt und das CSS
 * zeigt die Endzustaende (siehe Media-Query in globals.css).
 */
export function useScrollProgress() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]"));
    if (els.length === 0) return;

    // Erst wenn die Engine laeuft, greifen die dynamischen CSS-Regeln
    // (.scrollfx ...). Ohne JS oder bei reduced-motion zeigt das CSS die
    // Endzustaende - nichts bleibt unsichtbar haengen.
    document.documentElement.classList.add("scrollfx");

    let ticking = false;
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        // Weit ausserhalb: nicht anfassen (spart Style-Recalcs)
        if (rect.bottom < -vh || rect.top > vh * 2) continue;
        const mode = el.dataset.scroll;
        let p: number;
        if (mode === "pin") {
          p = clamp(-rect.top / Math.max(1, rect.height - vh));
        } else if (mode === "top") {
          p = clamp(window.scrollY / vh);
        } else {
          p = clamp((vh - rect.top) / (vh + rect.height));
        }
        el.style.setProperty("--p", p.toFixed(4));
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.classList.remove("scrollfx");
    };
  }, []);
}
