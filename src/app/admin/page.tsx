import { query, attachOrderItems } from "@/lib/db";
import { isAdminSession } from "@/lib/adminAuth";
import AdminOrders from "./AdminOrders";
import AdminLogin from "./AdminLogin";

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  customer_email: string;
  customer_name?: string;
  subtotal: number;
  payment_currency?: string | null;
  payment_amount?: number | null;
  created_at: string;
  cj_order_id?: string;
  cj_order_status?: string;
  tracking_number?: string;
  tracking_provider?: string;
  fulfillment_error?: string;
}

interface ProductRow {
  id: string;
  slug: string;
  name_de: string;
  price: number;
  active: boolean;
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) {
    return <AdminLogin />;
  }

  const orders = await query<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC");
  const products = await query<ProductRow>(
    "SELECT id, slug, name_de, price, active FROM products ORDER BY created_at ASC"
  );

  return <AdminOrders orders={await attachOrderItems(orders)} products={products} />;
}
