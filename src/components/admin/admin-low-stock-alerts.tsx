import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LowStockItem {
  id: string;
  name: string;
  variantName: string | null;
  stock: number;
  sku: string | null;
}

export function AdminLowStockAlerts({ items }: { items: LowStockItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/inventory">Manage Inventory</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All products are well stocked.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.variantName || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.sku || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        item.stock === 0
                          ? "font-bold text-destructive"
                          : "text-warning"
                      }
                    >
                      {item.stock}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
