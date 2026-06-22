"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CheckoutInput } from "@/lib/validators";

interface ShippingFormProps {
  form: UseFormReturn<CheckoutInput>;
}

export function ShippingForm({ form }: ShippingFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">
        Shipping Information
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shippingPhone">Phone Number *</Label>
          <Input
            id="shippingPhone"
            {...register("shippingPhone")}
            placeholder="01XXXXXXXXX"
          />
          {errors.shippingPhone && (
            <p className="text-sm text-destructive">
              {errors.shippingPhone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingAddress">Address *</Label>
        <Textarea
          id="shippingAddress"
          {...register("shippingAddress")}
          placeholder="Street address, apartment, suite, etc."
          rows={3}
        />
        {errors.shippingAddress && (
          <p className="text-sm text-destructive">
            {errors.shippingAddress.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shippingCity">City *</Label>
          <Input
            id="shippingCity"
            {...register("shippingCity")}
            placeholder="Dhaka"
          />
          {errors.shippingCity && (
            <p className="text-sm text-destructive">
              {errors.shippingCity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shippingPostalCode">Postal Code</Label>
          <Input
            id="shippingPostalCode"
            {...register("shippingPostalCode")}
            placeholder="1000"
          />
        </div>
      </div>
    </div>
  );
}
