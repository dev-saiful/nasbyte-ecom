"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatBDT } from "@/lib/utils";

interface CartItemProps {
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock: number;
  variantDetails?: Record<string, string> | null;
}

export function CartItem({
  productId,
  variantId,
  name,
  slug,
  price,
  image,
  quantity,
  stock,
  variantDetails,
}: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4">
      <Link href={`/products/${slug}`} className="shrink-0">
        <div className="relative size-20 overflow-hidden rounded-md bg-muted">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col">
        <Link
          href={`/products/${slug}`}
          className="text-sm font-medium hover:text-primary"
        >
          {name}
        </Link>

        {variantDetails && (
          <p className="text-xs text-muted-foreground">
            {Object.entries(variantDetails)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" | ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
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
          </div>

          <div className="flex items-center gap-4">
            <span className="font-medium">{formatBDT(price * quantity)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => removeItem(productId, variantId)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
