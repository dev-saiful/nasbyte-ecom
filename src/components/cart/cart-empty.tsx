import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShoppingBag className="mb-4 size-16 text-muted-foreground" />
      <h2 className="font-heading text-xl font-bold">Your cart is empty</h2>
      <p className="mt-2 text-muted-foreground">
        Add some items to your cart to get started
      </p>
      <Button asChild className="mt-6">
        <Link href="/products">Start Shopping</Link>
      </Button>
    </div>
  );
}
