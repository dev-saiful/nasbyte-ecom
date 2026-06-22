import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetails } from "@/components/order/order-details";
import { OrderTimeline } from "@/components/order/order-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. Your order number is{" "}
          <span className="font-medium text-foreground">
            {order.orderNumber}
          </span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderDetails
            items={order.items.map((item) => ({
              ...item,
              price: Number(item.price),
              total: Number(item.total),
            }))}
            subtotal={Number(order.subtotal)}
            shippingCost={Number(order.shippingCost)}
            total={Number(order.total)}
            shippingAddress={order.shippingAddress}
            shippingCity={order.shippingCity}
            shippingPostalCode={order.shippingPostalCode}
            paymentMethod={order.paymentMethod}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/products"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Continue Shopping
            </Link>
            <Link
              href="/track-order"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
