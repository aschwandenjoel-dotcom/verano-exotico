import { createServiceClient } from "@/lib/supabase";
import { isAdminSession } from "@/lib/adminAuth";
import AdminOrders from "./AdminOrders";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) {
    return <AdminLogin />;
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

  return <AdminOrders orders={orders ?? []} products={products ?? []} />;
}
