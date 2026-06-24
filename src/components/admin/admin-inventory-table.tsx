"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Save,
  X,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { AdminStockLogDialog } from "./admin-stock-log-dialog";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  hasVariants: boolean;
}

function getStockStatus(stock: number) {
  if (stock === 0)
    return { label: "Out of Stock", variant: "destructive" as const };
  if (stock <= 10)
    return { label: "Low Stock", variant: "secondary" as const };
  return { label: "In Stock", variant: "default" as const };
}

export function AdminInventoryTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const [logProductId, setLogProductId] = useState<string | null>(null);
  const [logProductName, setLogProductName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (stockFilter) params.set("stockStatus", stockFilter);

      const res = await fetch(`/api/admin/inventory/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditValue(String(product.stock));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveStock(productId: string) {
    const newStock = Number(editValue);
    if (Number.isNaN(newStock) || newStock < 0) {
      cancelEdit();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock: data.product.stock } : p,
        ),
      );
      cancelEdit();
    } catch {
      console.error("Failed to save stock");
    } finally {
      setSaving(false);
    }
  }

  function openLogs(product: Product) {
    setLogProductId(product.id);
    setLogProductName(product.name);
  }

  if (loading && products.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Loading inventory...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={stockFilter}
            onValueChange={(v) => {
              setStockFilter(v === "all" || v === null ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground text-sm">
          {total} product{total !== 1 ? "s" : ""} found
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="w-[120px]">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const status = getStockStatus(product.stock);
                const isEditing = editingId === product.id;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.hasVariants && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          (has variants)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.sku ?? "—"}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 w-20"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveStock(product.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => saveStock(product.id)}
                            disabled={saving}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={cancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="hover:bg-muted rounded px-2 py-1 text-left font-mono text-sm"
                          onClick={() => startEdit(product)}
                        >
                          {product.stock}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openLogs(product)}
                        title="View stock history"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <AdminStockLogDialog
        open={!!logProductId}
        onOpenChange={(o) => {
          if (!o) setLogProductId(null);
        }}
        productId={logProductId || ""}
        productName={logProductName}
      />
    </>
  );
}
