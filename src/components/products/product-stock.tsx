import { Badge } from "@/components/ui/badge";

interface ProductStockProps {
  stock: number;
}

export function ProductStock({ stock }: ProductStockProps) {
  if (stock === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }

  if (stock <= 10) {
    return (
      <Badge variant="secondary" className="text-orange-600">
        Low Stock ({stock} left)
      </Badge>
    );
  }

  return <Badge variant="secondary">In Stock</Badge>;
}
