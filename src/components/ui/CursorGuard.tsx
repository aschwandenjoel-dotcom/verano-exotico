"use client";

import { useEffect } from "react";

export default function CursorGuard() {
  useEffect(() => {
    function fix(el: Element) {
      const h = el as HTMLElement;
      if (h.style?.cursor && h.style.cursor !== "") {
        h.style.removeProperty("cursor");
      }
    }

    // Fix anything already in the DOM
    document.querySelectorAll("*").forEach(fix);

    // Watch for future inline-style cursor changes (Pannellum does this)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "style") {
          fix(m.target as Element);
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
