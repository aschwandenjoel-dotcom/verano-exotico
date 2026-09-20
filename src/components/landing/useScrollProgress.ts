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

    // Bezugselement pro Eintrag einmal bestimmen (Hero: die umgebende Sektion,
    // denn der Hero beginnt erst nach dem 100svh-Panorama).
    const refs = els.map((el) => (el.dataset.scroll === "top" ? (el.closest("section") ?? el) : el));
    const last = new Array<string>(els.length).fill("");

    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      // Erst ALLE messen, dann ALLE schreiben. Abwechselnd messen/schreiben
      // wuerde vor jeder Messung eine neue Style-Berechnung erzwingen
      // (Layout-Thrashing) - auf einer bildlastigen Seite pro Frame teuer.
      const values = new Array<string | null>(els.length).fill(null);
      for (let i = 0; i < els.length; i++) {
        const rect = refs[i].getBoundingClientRect();
        // Weit ausserhalb: nicht anfassen (spart Style-Recalcs)
        if (rect.bottom < -vh || rect.top > vh * 2) continue;
        const mode = els[i].dataset.scroll;
        let p: number;
        if (mode === "pin") {
          p = clamp(-rect.top / Math.max(1, rect.height - vh));
        } else if (mode === "top") {
          // 0, solange die Sektion noch nicht oben anliegt; 1 nach 0.7 Viewport-Hoehen.
          p = clamp(-rect.top / (vh * 0.7));
        } else {
          p = clamp((vh - rect.top) / (vh + rect.height));
        }
        values[i] = p.toFixed(3);
      }
      for (let i = 0; i < els.length; i++) {
        const v = values[i];
        if (v !== null && v !== last[i]) {
          last[i] = v;
          els[i].style.setProperty("--p", v);
        }
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
