"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceOrderButtonProps {
  isLoading: boolean;
  disabled: boolean;
}

export function PlaceOrderButton({
  isLoading,
  disabled,
}: PlaceOrderButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Place Order"
      )}
    </Button>
  );
}
