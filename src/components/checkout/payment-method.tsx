"use client";

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { CheckoutInput } from "@/lib/validators";

interface PaymentMethodProps {
  form: UseFormReturn<CheckoutInput>;
}

export function PaymentMethod({ form }: PaymentMethodProps) {
  const { watch, setValue } = form;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Payment Method</h2>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 rounded-lg border p-4">
          <input
            type="radio"
            id="cod"
            value="CASH_ON_DELIVERY"
            checked={watch("paymentMethod") === "CASH_ON_DELIVERY"}
            onChange={() => setValue("paymentMethod", "CASH_ON_DELIVERY")}
            className="size-4"
          />
          <Label htmlFor="cod" className="flex-1 cursor-pointer">
            <div className="font-medium">Cash on Delivery</div>
            <div className="text-sm text-muted-foreground">
              Pay when you receive your order
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border p-4 opacity-50">
          <input
            type="radio"
            id="card"
            value="CARD"
            disabled
            className="size-4"
          />
          <Label htmlFor="card" className="flex-1 cursor-not-allowed">
            <div className="font-medium">Card Payment</div>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border p-4 opacity-50">
          <input
            type="radio"
            id="mobile"
            value="MOBILE_BANKING"
            disabled
            className="size-4"
          />
          <Label htmlFor="mobile" className="flex-1 cursor-not-allowed">
            <div className="font-medium">Mobile Banking</div>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </Label>
        </div>
      </div>
    </div>
  );
}
