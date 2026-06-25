"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface CartActionsProps {
  variantId: string;
  quantity: number;
  stock: number;
}

export function CartActions({ variantId, quantity, stock }: CartActionsProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => updateQuantity(variantId, quantity - 1)}
        disabled={quantity <= 1}
      >
        <Minus className="size-3" />
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => updateQuantity(variantId, quantity + 1)}
        disabled={quantity >= stock}
      >
        <Plus className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 size-8 text-destructive"
        onClick={() => removeItem(variantId)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
