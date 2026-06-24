"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  _count: { items: number };
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

export function AdminOrderTable() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function handleFilterChange() {
    setPage(1);
  }

  if (loading && orders.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading orders...
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by order #, name, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" || v === null ? "" : v);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={paymentFilter}
          onValueChange={(v) => {
            setPaymentFilter(v === "all" || v === null ? "" : v);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            handleFilterChange();
          }}
          className="w-[150px]"
          placeholder="Start date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            handleFilterChange();
          }}
          className="w-[150px]"
          placeholder="End date"
        />
      </div>

      <div className="text-muted-foreground text-sm">
        {total} order{total !== 1 ? "s" : ""} found
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.user?.name ?? "Guest"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {order.user?.email ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(order.createdAt).toLocaleDateString("en-BD", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPaymentVariant(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatBDT(order.total)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
