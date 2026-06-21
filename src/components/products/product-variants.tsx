"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  variantOptions: {
    optionValue: {
      value: string;
      option: { name: string };
    };
  }[];
}

interface ProductVariantsProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
}

export function ProductVariants({
  variants,
  selectedVariantId,
  onSelectVariant,
}: ProductVariantsProps) {
  if (variants.length === 0) return null;

  const activeVariants = variants.filter((v) => v.isActive);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Options</h3>
      <div className="flex flex-wrap gap-2">
        {activeVariants.map((variant) => (
          <Button
            key={variant.id}
            variant={selectedVariantId === variant.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectVariant(variant.id)}
            disabled={variant.stock === 0}
            className={cn(
              selectedVariantId === variant.id && "ring-2 ring-primary",
            )}
          >
            {variant.name ||
              variant.variantOptions
                .map((vo) => vo.optionValue.value)
                .join(" / ")}
          </Button>
        ))}
      </div>
    </div>
  );
}
