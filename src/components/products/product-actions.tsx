"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface ProductActionsProps {
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  stock: number;
  quantity: number;
  variantDetails?: Record<string, string> | null;
}

export function ProductActions({
  productId,
  variantId,
  name,
  slug,
  price,
  image,
  stock,
  quantity,
  variantDetails,
}: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (stock === 0) {
      toast.error("Product is out of stock");
      return;
    }

    addItem({
      productId,
      variantId,
      name,
      slug,
      price,
      image,
      quantity,
      stock,
      variantDetails,
    });

    toast.success("Added to cart", {
      description: `${name} has been added to your cart`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <div className="flex gap-3">
      <Button
        size="lg"
        className="flex-1"
        onClick={handleAddToCart}
        disabled={stock === 0}
      >
        <ShoppingCart className="mr-2 size-4" />
        Add to Cart
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="flex-1"
        onClick={handleBuyNow}
        disabled={stock === 0}
      >
        <Zap className="mr-2 size-4" />
        Buy Now
      </Button>
    </div>
  );
}
