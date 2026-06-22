"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OrderTimeline } from "@/components/order/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBDT } from "@/lib/utils";

interface OrderData {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/track-order?orderNumber=${encodeURIComponent(orderNumber)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order not found");
      }

      setOrder(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to track order",
      );
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Track Order</h1>
      <p className="mt-2 text-muted-foreground">
        Enter your order number to track your order status
      </p>

      <div className="mt-6 flex gap-2">
        <Input
          placeholder="Order number (e.g., ORD-XXXXXXXXXX)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="mr-2 size-4" />
          Track
        </Button>
      </div>

      {order && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Order {order.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <OrderTimeline currentStatus={order.status} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {order.status.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Payment</p>
                <p className="text-sm text-muted-foreground">
                  {order.paymentMethod.replace(/_/g, " ")} (
                  {order.paymentStatus})
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Items</p>
              <div className="mt-2 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <span>{formatBDT(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between border-t pt-4 font-medium">
              <span>Total</span>
              <span>{formatBDT(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
