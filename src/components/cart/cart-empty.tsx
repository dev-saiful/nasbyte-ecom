import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShoppingBag className="mb-4 size-16 text-muted-foreground" />
      <h2 className="font-heading text-xl font-bold">Your cart is empty</h2>
      <p className="mt-2 text-muted-foreground">
        Add some items to your cart to get started
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Start Shopping
      </Link>
    </div>
  );
}
