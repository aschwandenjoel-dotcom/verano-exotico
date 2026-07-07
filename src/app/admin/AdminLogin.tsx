"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler — bitte erneut versuchen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F3E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={handleSubmit} style={{ background: "#FFFFFF", borderRadius: "16px", padding: "40px", width: "320px", boxShadow: "0 4px 24px rgba(26,48,64,0.08)" }}>
        <p style={{ fontFamily: "sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9E9E9E", marginBottom: "20px" }}>Admin</p>
        <h1 style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "20px", color: "#1A3040", textTransform: "uppercase", marginBottom: "24px" }}>Zugang</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          autoFocus
          style={{ width: "100%", padding: "12px 16px", border: "1px solid rgba(26,48,64,0.15)", borderRadius: "8px", fontSize: "14px", color: "#1A3040", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
        />
        {error && (
          <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: "#C0392B", marginBottom: "12px" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "13px", background: "#1A3040", color: "#F8F3E8", border: "none", borderRadius: "9999px", fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Prüfe…" : "Einloggen"}
        </button>
      </form>
    </div>
  );
}
