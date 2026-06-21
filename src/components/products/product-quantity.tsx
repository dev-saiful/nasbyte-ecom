"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductQuantityProps {
  quantity: number;
  maxStock: number;
  onChange: (quantity: number) => void;
}

export function ProductQuantity({
  quantity,
  maxStock,
  onChange,
}: ProductQuantityProps) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (value: string) => {
    const num = Number.parseInt(value, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= maxStock) {
      onChange(num);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrease}
        disabled={quantity <= 1}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => handleInputChange(e.target.value)}
        className="w-16 text-center"
        min={1}
        max={maxStock}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrease}
        disabled={quantity >= maxStock}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
