"use client";

import { resetConsent } from "@/lib/consent";

/**
 * Link in der Datenschutzerklärung, mit dem die Entscheidung zur
 * Reichweitenmessung widerrufen wird — danach erscheint der Hinweis erneut.
 * Eigene Client-Komponente, damit die Datenschutzseite serverseitig
 * gerendert bleibt.
 */
export default function ConsentReset({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        resetConsent();
        // Das Banner erscheint unten wieder - dorthin scrollen, sonst wirkt
        // der Klick wie ohne Wirkung.
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "#1A3040",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
