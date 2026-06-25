"use client";

import {
  ArrowLeft,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/utils";
import { AdminDeleteDialog } from "./admin-delete-dialog";

interface UserAddress {
  id: string;
  label: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string;
  isDefault: boolean;
}

interface UserOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { orders: number; addresses: number };
  addresses: UserAddress[];
  orders: UserOrder[];
}

interface AdminUserDetailProps {
  userId: string;
}

export function AdminUserDetail({ userId }: AdminUserDetailProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setUser(data.user);
      } catch {
        toast.error("Failed to load user");
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId, router]);

  async function handleToggleVerify() {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUser((prev) =>
        prev ? { ...prev, isVerified: data.user.isVerified } : null,
      );
      toast.success(data.user.isVerified ? "User verified" : "User unverified");
    } catch {
      toast.error("Failed to toggle verification");
    }
  }

  async function handleToggleRole() {
    if (!user) return;
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      const data = await res.json();
      setUser((prev) => (prev ? { ...prev, role: data.user.role } : null));
      toast.success(`Role changed to ${newRole}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success("User deleted");
      router.push("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-[200px] w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/admin/users" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <Button render={<Link href={`/admin/users/${user.id}/edit`} />}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Name</p>
                  <p className="text-sm font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p className="text-sm font-medium">{user.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Role</p>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Verified</p>
                  <Badge variant={user.isVerified ? "default" : "secondary"}>
                    {user.isVerified ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Joined</p>
                  <p className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString("en-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders ({user._count.orders})</CardTitle>
            </CardHeader>
            <CardContent>
              {user.orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {user.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {order.orderNumber}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-BD",
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{order.status}</Badge>
                        <p className="mt-1 text-sm font-medium">
                          {formatBDT(order.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleToggleVerify}
              >
                {user.isVerified ? (
                  <>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Unverify User
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify User
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleToggleRole}
              >
                {user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="text-destructive w-full justify-start"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </Button>
            </CardContent>
          </Card>

          {user.addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Addresses ({user._count.addresses})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.addresses.map((addr) => (
                  <div key={addr.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {addr.label || "Address"}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1">{addr.address}</p>
                    <p className="text-muted-foreground">
                      {addr.city}
                      {addr.postalCode ? `, ${addr.postalCode}` : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AdminDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title={`Delete user "${user.name}"?`}
        description="This action cannot be undone. The user will be soft-deleted."
      />
    </div>
  );
}
