"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StockLog {
  id: string;
  oldStock: number;
  newStock: number;
  delta: number;
  createdAt: string;
  user: { id: string; name: string } | null;
}

interface AdminStockLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export function AdminStockLogDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: AdminStockLogDialogProps) {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/inventory/products/${productId}/logs?page=${p}&limit=10`,
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      } catch {
        console.error("Failed to load logs");
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    if (!open || !productId) return;
    setPage(1);
    fetchLogs(1);
  }, [open, productId, fetchLogs]);

  function changePage(p: number) {
    setPage(p);
    fetchLogs(p);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock History — {productName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground py-8 text-center">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No stock changes recorded yet
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Old</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleDateString("en-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user?.name ?? "System"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {log.oldStock}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {log.newStock}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span
                          className={
                            log.delta > 0
                              ? "text-green-600"
                              : log.delta < 0
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {log.delta > 0 ? "+" : ""}
                          {log.delta}
                        </span>
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
                    onClick={() => changePage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => changePage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
