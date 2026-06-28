"use client";

import { useState } from "react";
import { ProductActions } from "./product-actions";
import { ProductQuantity } from "./product-quantity";
import { ProductVariants } from "./product-variants";

interface ProductPurchaseProps {
  variantId: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  stock: number;
  variantDetails?: Record<string, string> | null;
  variants?: {
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
  }[];
}

export function ProductPurchase({
  variantId,
  name,
  slug,
  price,
  image,
  stock,
  variantDetails,
  variants,
}: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(variantId);

  const selectedVariant = variants?.find((v) => v.id === selectedVariantId);
  const effectivePrice = selectedVariant?.price ?? price;
  const effectiveStock = selectedVariant?.stock ?? stock;
  const effectiveVariantDetails = selectedVariant
    ? Object.fromEntries(
        selectedVariant.variantOptions.map((vo) => [
          vo.optionValue.option.name,
          vo.optionValue.value,
        ]),
      )
    : variantDetails;

  return (
    <div className="space-y-4">
      {variants && variants.length > 0 && (
        <ProductVariants
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelectVariant={(id) => {
            setSelectedVariantId(id);
            setQuantity(1);
          }}
        />
      )}
      <ProductQuantity
        quantity={quantity}
        maxStock={effectiveStock}
        onChange={setQuantity}
      />
      <ProductActions
        variantId={selectedVariantId}
        name={name}
        slug={slug}
        price={effectivePrice}
        image={image}
        stock={effectiveStock}
        quantity={quantity}
        variantDetails={effectiveVariantDetails}
      />
    </div>
  );
}
