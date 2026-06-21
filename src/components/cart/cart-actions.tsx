"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface CartActionsProps {
  productId: string;
  variantId?: string | null;
  quantity: number;
  stock: number;
}

export function CartActions({
  productId,
  variantId,
  quantity,
  stock,
}: CartActionsProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => updateQuantity(productId, quantity - 1, variantId)}
        disabled={quantity <= 1}
      >
        <Minus className="size-3" />
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => updateQuantity(productId, quantity + 1, variantId)}
        disabled={quantity >= stock}
      >
        <Plus className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 size-8 text-destructive"
        onClick={() => removeItem(productId, variantId)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
