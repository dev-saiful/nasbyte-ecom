import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SHIPPING_COST } from "@/lib/price";
import { formatBDT } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  const total = subtotal + SHIPPING_COST;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>{formatBDT(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{formatBDT(SHIPPING_COST)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatBDT(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Proceed to Checkout
        </Link>
        <Link
          href="/products"
          className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Continue Shopping
        </Link>
      </CardContent>
    </Card>
  );
}
