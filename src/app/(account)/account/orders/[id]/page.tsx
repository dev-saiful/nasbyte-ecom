import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderTimeline } from "@/components/order/order-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBDT } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      items: {
        include: {
          variant: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!order) {
    redirect("/account/orders");
  }

  const orderSerialized = {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
      total: Number(item.total),
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/account/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          Order {orderSerialized.orderNumber}
        </h1>
        <Badge variant="secondary">
          {orderSerialized.status.charAt(0) +
            orderSerialized.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderSerialized.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatBDT(item.price)}
                    </p>
                  </div>
                  <span className="font-medium">{formatBDT(item.total)}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatBDT(orderSerialized.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatBDT(orderSerialized.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatBDT(orderSerialized.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                {orderSerialized.shippingAddress}
                <br />
                {orderSerialized.shippingCity}
                {orderSerialized.shippingPostalCode &&
                  `, ${orderSerialized.shippingPostalCode}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Phone: {orderSerialized.shippingPhone}
              </p>
              <p className="text-sm text-muted-foreground">
                Payment: {orderSerialized.paymentMethod.replace(/_/g, " ")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={orderSerialized.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
