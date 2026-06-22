"use client";

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CheckoutInput } from "@/lib/validators";

interface OrderNotesProps {
  form: UseFormReturn<CheckoutInput>;
}

export function OrderNotes({ form }: OrderNotesProps) {
  const { register } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Order Notes (Optional)</Label>
      <Textarea
        id="notes"
        {...register("notes")}
        placeholder="Special instructions for delivery..."
        rows={3}
      />
    </div>
  );
}
