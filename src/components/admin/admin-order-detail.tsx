"use client";

import { ArrowLeft, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  total: number;
  variantDetails: Record<string, string> | null;
  product: { id: string; name: string; slug: string } | null;
  variant: { id: string; name: string | null };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  shippingPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  items: OrderItem[];
}

function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "secondary" as const;
    case "CONFIRMED":
    case "PROCESSING":
      return "default" as const;
    case "SHIPPED":
    case "DELIVERED":
      return "default" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function getPaymentVariant(status: string) {
  switch (status) {
    case "PAID":
      return "default" as const;
    case "PENDING":
      return "secondary" as const;
    case "FAILED":
    case "REFUNDED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

interface AdminOrderDetailProps {
  orderId: string;
}

export function AdminOrderDetail({ orderId }: AdminOrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setOrder(data.order);
      } catch {
        toast.error("Failed to load order");
        router.push("/admin/orders");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId, router]);

  async function handleStatusUpdate(newStatus: string | null) {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setOrder((prev) =>
        prev ? { ...prev, status: data.order.status } : null,
      );
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePaymentUpdate(newPaymentStatus: string | null) {
    if (!newPaymentStatus) return;
    setUpdatingPayment(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setOrder((prev) =>
        prev ? { ...prev, paymentStatus: data.order.paymentStatus } : null,
      );
      toast.success("Payment status updated");
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setUpdatingPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/admin/orders" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Order {order.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-BD", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Order Number
                </span>
                <span className="font-mono text-sm">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Items</span>
                <span className="text-sm">{order.items.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Name</span>
                <span className="text-sm">{order.user?.name ?? "Guest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Email</span>
                <span className="text-sm">{order.user?.email ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Phone</span>
                <span className="text-sm">
                  {order.user?.phone ?? order.shippingPhone}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm">{order.shippingAddress}</p>
              <p className="text-sm">
                {order.shippingCity}
                {order.shippingPostalCode
                  ? `, ${order.shippingPostalCode}`
                  : ""}
              </p>
              <p className="text-sm">Phone: {order.shippingPhone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <Package className="text-muted-foreground h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      {item.variant.name && (
                        <p className="text-muted-foreground text-xs">
                          {item.variant.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p>
                        {item.quantity} x {formatBDT(item.price)}
                      </p>
                      <p className="font-medium">{formatBDT(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Method</span>
                <span className="text-sm">
                  {order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant={getPaymentVariant(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Subtotal</span>
                <span className="text-sm">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Shipping</span>
                <span className="text-sm">{formatBDT(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatBDT(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Order Status</p>
                <div className="flex gap-2">
                  <Select
                    value={order.status}
                    onValueChange={handleStatusUpdate}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Status</p>
                <div className="flex gap-2">
                  <Select
                    value={order.paymentStatus}
                    onValueChange={handlePaymentUpdate}
                    disabled={updatingPayment}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
