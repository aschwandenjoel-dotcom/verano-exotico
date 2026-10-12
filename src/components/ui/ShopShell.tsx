import Header from "./Header";
import Footer from "./Footer";
import type { Locale } from "@/types";

export default function ShopShell({
  children,
  locale,
  transparentHeader = false,
}: {
  children: React.ReactNode;
  locale: Locale;
  /** Header über dem Titelbild durchsichtig (Seite markiert das Ende mit data-header-solid-from) */
  transparentHeader?: boolean;
}) {
  return (
    <div className="min-h-full flex flex-col bg-bg-dark text-text-primary">
      <Header locale={locale} transparentAtTop={transparentHeader} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
