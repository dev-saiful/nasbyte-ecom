import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { SHIPPING_COST } from "@/lib/price";
import { formatBDT } from "@/lib/utils";

export function OrderSummary() {
  const { items, totalPrice } = useCart();
  const total = totalPrice + SHIPPING_COST;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-64 space-y-3 overflow-auto">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    No Img
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium">
                {formatBDT(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatBDT(totalPrice)}</span>
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
      </CardContent>
    </Card>
  );
}
