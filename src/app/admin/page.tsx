import { createServiceClient } from "@/lib/supabase";
import AdminOrders from "./AdminOrders";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>;
}) {
  const { pw } = await searchParams;
  const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "verano2025";

  if (pw !== ADMIN_PW) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F3E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form style={{ background: "#FFFFFF", borderRadius: "16px", padding: "40px", width: "320px", boxShadow: "0 4px 24px rgba(26,48,64,0.08)" }}>
          <p style={{ fontFamily: "sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9E9E9E", marginBottom: "20px" }}>Admin</p>
          <h1 style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "20px", color: "#1A3040", textTransform: "uppercase", marginBottom: "24px" }}>Zugang</h1>
          <input name="pw" type="password" placeholder="Passwort" style={{ width: "100%", padding: "12px 16px", border: "1px solid rgba(26,48,64,0.15)", borderRadius: "8px", fontSize: "14px", color: "#1A3040", outline: "none", boxSizing: "border-box", marginBottom: "16px" }} />
          <button type="submit" style={{ width: "100%", padding: "13px", background: "#1A3040", color: "#F8F3E8", border: "none", borderRadius: "9999px", fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
            Einloggen
          </button>
        </form>
      </div>
    );
  }

  const db = createServiceClient();
  const { data: orders } = await db
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  const { data: products } = await db
    .from("products")
    .select("id, slug, name_de, price, active")
    .order("created_at", { ascending: true });

  return <AdminOrders orders={orders ?? []} products={products ?? []} pw={pw} />;
}
