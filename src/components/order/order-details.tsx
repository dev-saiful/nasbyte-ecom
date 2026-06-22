import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/utils";

interface OrderDetailsProps {
  items: {
    id: string;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  paymentMethod: string;
}

export function OrderDetails({
  items,
  subtotal,
  shippingCost,
  total,
  shippingAddress,
  shippingCity,
  shippingPostalCode,
  paymentMethod,
}: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No Img
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity} x {formatBDT(item.price)}
                </p>
              </div>
              <span className="font-medium">{formatBDT(item.total)}</span>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatBDT(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{formatBDT(shippingCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatBDT(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping & Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Shipping Address</p>
            <p className="text-sm text-muted-foreground">
              {shippingAddress}
              <br />
              {shippingCity}
              {shippingPostalCode && `, ${shippingPostalCode}`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Payment Method</p>
            <p className="text-sm text-muted-foreground">
              {paymentMethod.replace(/_/g, " ")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
