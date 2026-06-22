import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/utils";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    averageRating: number;
    reviewCount: number;
    isFeatured: boolean;
    category?: { name: string; slug: string } | null;
    productImages?: { path: string; sortOrder: number }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.productImages?.[0]?.path ?? null;
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No Image
            </div>
          )}
          {hasDiscount && (
            <Badge
              variant="destructive"
              className="absolute left-2 top-2 text-xs"
            >
              Sale
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="default" className="absolute right-2 top-2 text-xs">
              Featured
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        {product.category && (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {product.category.name}
          </Link>
        )}

        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-tight hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={`star-${star}`}
              className={`size-3 ${
                star <= Math.round(Number(product.averageRating))
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">
            {formatBDT(Number(product.price))}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(Number(product.compareAtPrice))}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1">
            Add to Cart
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
