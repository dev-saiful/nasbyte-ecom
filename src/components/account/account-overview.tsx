import { MapPin, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountOverviewProps {
  totalOrders: number;
  pendingOrders: number;
  savedAddresses: number;
  recentOrder: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: Date;
  } | null;
  defaultAddress: {
    id: string;
    recipientName: string;
    addressLine: string;
    city: string;
  } | null;
}

export function AccountOverview({
  totalOrders,
  pendingOrders,
  savedAddresses,
  recentOrder,
  defaultAddress,
}: AccountOverviewProps) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Account Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Saved Addresses
            </CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedAddresses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Order</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrder ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {recentOrder.orderNumber}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {recentOrder.status.charAt(0) +
                      recentOrder.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {new Date(recentOrder.createdAt).toLocaleDateString()}
                  </span>
                  <span>৳{Number(recentOrder.total).toLocaleString()}</span>
                </div>
                <Link
                  href={`/account/orders/${recentOrder.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Details →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Default Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {defaultAddress ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {defaultAddress.recipientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {defaultAddress.addressLine}
                </p>
                <p className="text-sm text-muted-foreground">
                  {defaultAddress.city}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No default address set
                </p>
                <Link
                  href="/account/addresses"
                  className="text-sm text-primary hover:underline"
                >
                  Add Address →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
