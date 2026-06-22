import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBDT } from "@/lib/utils";

function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "CONFIRMED":
    case "PROCESSING":
      return "default";
    case "SHIPPED":
    case "DELIVERED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: {
      items: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Order History</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <Link
              href="/products"
              className="mt-2 text-sm text-primary hover:underline"
            >
              Start Shopping →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {order.orderNumber}
                </CardTitle>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {new Date(order.createdAt).toLocaleDateString("en-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p>{order.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatBDT(Number(order.total))}
                    </p>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
