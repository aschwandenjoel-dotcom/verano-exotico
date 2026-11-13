/**
 * Einfache Begrenzung pro Schlüssel (meist IP) im Speicher der Function.
 * Auf Vercel hat jede Instanz ihren eigenen Speicher, die Grenze gilt also pro
 * Instanz. Reicht gegen Skripte, die einen Endpunkt in Schleife aufrufen.
 */
const hits = new Map<string, number[]>();

export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
