import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin – Verano Exotico",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
