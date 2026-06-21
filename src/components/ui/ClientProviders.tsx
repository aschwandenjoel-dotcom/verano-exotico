"use client";

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
