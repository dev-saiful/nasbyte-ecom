"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AdminDeleteDialog } from "./admin-delete-dialog";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: {
    id: string;
    name: string;
    slug: string;
    productImages: { path: string }[];
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm" title={`${rating}/5`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export function AdminReviewTable() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (approvedFilter) params.set("isApproved", approvedFilter);

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReviews(data.reviews);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      console.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, approvedFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function toggleSelectAll() {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/approve`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed");
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: true } : r)),
      );
    } catch {
      console.error("Failed to approve");
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/reject`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed");
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: false } : r)),
      );
    } catch {
      console.error("Failed to reject");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/reviews/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setReviews((prev) => prev.filter((r) => r.id !== deleteId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      setDeleteId(null);
    } catch {
      console.error("Failed to delete");
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/admin/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          reviewIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setReviews((prev) =>
        prev.map((r) =>
          selectedIds.has(r.id) ? { ...r, isApproved: true } : r,
        ),
      );
      setSelectedIds(new Set());
    } catch {
      console.error("Failed to bulk approve");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/admin/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          reviewIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setReviews((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    } catch {
      console.error("Failed to bulk delete");
    }
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by reviewer or product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={approvedFilter}
          onValueChange={(v) => {
            setApprovedFilter(v === "all" || v === null ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Approved</SelectItem>
            <SelectItem value="false">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-muted flex items-center gap-3 rounded-lg px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="outline" onClick={handleBulkApprove}>
            <Check className="mr-1 h-4 w-4" />
            Approve All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete All
          </Button>
        </div>
      )}

      <div className="text-muted-foreground text-sm">
        {total} review{total !== 1 ? "s" : ""} found
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    selectedIds.size === reviews.length && reviews.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(review.id)}
                    onCheckedChange={() => toggleSelect(review.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {review.product.productImages[0]?.path && (
                      <img
                        src={review.product.productImages[0].path}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {review.product.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{review.user.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {review.user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <StarRating rating={review.rating} />
                </TableCell>
                <TableCell>
                  <Badge variant={review.isApproved ? "default" : "secondary"}>
                    {review.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(review.createdAt).toLocaleDateString("en-BD", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {review.isApproved ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReject(review.id)}
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleApprove(review.id)}
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(review.id)}
                      title="Delete"
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
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

      <AdminDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete this review?"
        description="This action cannot be undone. The review will be permanently deleted."
      />
    </div>
  );
}
