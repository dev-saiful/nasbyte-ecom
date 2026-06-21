import { Star } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ProductInfoProps {
  name: string;
  category?: { name: string; slug: string } | null;
  price: number;
  compareAtPrice?: number | null;
  averageRating: number;
  reviewCount: number;
  description?: string | null;
}

export function ProductInfo({
  name,
  category,
  price,
  compareAtPrice,
  averageRating,
  reviewCount,
  description,
}: ProductInfoProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;

  return (
    <div className="space-y-4">
      {category && (
        <p className="text-sm text-muted-foreground">{category.name}</p>
      )}
      <h1 className="text-3xl font-heading font-bold">{name}</h1>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`size-4 ${
                star <= Math.round(averageRating)
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          ({reviewCount} reviews)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{formatBDT(price)}</span>
        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">
            {formatBDT(compareAtPrice)}
          </span>
        )}
      </div>

      {description && (
        <div className="prose prose-sm max-w-none text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  );
}
