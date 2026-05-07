import Header from "./Header";
import Footer from "./Footer";
import type { Locale } from "@/types";

export default function ShopShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <div className="min-h-full flex flex-col bg-bg-dark text-text-primary">
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
