"use client";

import { CartEmpty } from "@/components/cart/cart-empty";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { items, totalItems, totalPrice } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Shopping Cart</h1>

      {items.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <CartItem key={item.id} {...item} />
            ))}
          </div>
          <div>
            <CartSummary subtotal={totalPrice} itemCount={totalItems} />
          </div>
        </div>
      )}
    </div>
  );
}
