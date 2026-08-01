import mysql from "mysql2/promise";

// Hostpoint-Shared-Hosting-MySQL begrenzt gleichzeitige Verbindungen pro DB-User
// meist auf eine niedrige Zahl. Der Pool bleibt daher bewusst klein, damit
// parallele Vercel-Function-Invocations das Limit nicht sprengen.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: "utf8mb4",
  // TINYINT(1)-Spalten (is_new, active, approved) als echte Booleans liefern
  // statt als 0/1, damit der bisherige Supabase-Aufrufcode unverändert funktioniert.
  typeCast(field, next) {
    if (field.type === "TINY" && field.length === 1) {
      const value = field.string();
      return value === null ? null : value === "1";
    }
    return next();
  },
});

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Liest eine JSON-Spalte aus, egal ob der Treiber sie schon geparst hat.
 *
 * Hostpoint läuft auf MariaDB, und dort ist `json` nur ein Alias für
 * `longtext` — der Server meldet also nicht den echten JSON-Spaltentyp.
 * mysql2 parst nur bei diesem Typ automatisch (siehe Types.JSON), weshalb
 * MariaDB den Inhalt als String zurückgibt, MySQL dagegen als Objekt.
 * Ohne diese Normalisierung wären `colors`/`images`/`sizes` Strings statt
 * Arrays und `shipping_address` ein String statt einer Adresse.
 */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_slug: string;
  product_name: string;
  price: number;
  quantity: number;
  color: string | null;
  color_name: string | null;
  size: string | null;
  image: string | null;
}

/**
 * Emuliert Supabase's `.select("*, order_items(*)")`-Join: lädt die Order-Items
 * für eine Menge von Bestellungen in einer zweiten Abfrage nach und hängt sie
 * als `order_items`-Array an (MySQL kennt kein verschachteltes Relations-Select).
 */
export async function attachOrderItems<T extends { id: string }>(
  orders: T[]
): Promise<(T & { order_items: OrderItemRow[] })[]> {
  if (orders.length === 0) return [];
  const ids = orders.map((o) => o.id);
  const items = await query<OrderItemRow>(
    "SELECT * FROM order_items WHERE order_id IN (?)",
    [ids]
  );
  const byOrder = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }
  return orders.map((order) => ({ ...order, order_items: byOrder.get(order.id) ?? [] }));
}

export default pool;
