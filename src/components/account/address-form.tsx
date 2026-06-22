"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AddressInput, addressSchema } from "@/lib/validators";

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
    postalCode: string | null;
    isDefault: boolean;
  } | null;
  onSuccess: () => void;
}

export function AddressForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AddressFormProps) {
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: "",
      phone: "",
      addressLine: "",
      city: "",
      postalCode: "",
      country: "Bangladesh",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        recipientName: initialData.recipientName,
        phone: initialData.phone,
        addressLine: initialData.addressLine,
        city: initialData.city,
        postalCode: initialData.postalCode ?? "",
        country: "Bangladesh",
        isDefault: initialData.isDefault,
      });
    } else {
      form.reset({
        recipientName: "",
        phone: "",
        addressLine: "",
        city: "",
        postalCode: "",
        country: "Bangladesh",
        isDefault: false,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: AddressInput) => {
    try {
      const url = initialData
        ? `/api/account/addresses/${initialData.id}`
        : "/api/account/addresses";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save address");
      }

      toast.success(initialData ? "Address updated" : "Address added");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to save address");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input id="recipientName" {...form.register("recipientName")} />
            {form.formState.errors.recipientName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.recipientName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine">Address *</Label>
            <Input id="addressLine" {...form.register("addressLine")} />
            {form.formState.errors.addressLine && (
              <p className="text-sm text-destructive">
                {form.formState.errors.addressLine.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...form.register("city")} />
              {form.formState.errors.city && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" {...form.register("postalCode")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              {...form.register("isDefault")}
              className="size-4"
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default address
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {initialData ? "Update" : "Add"} Address
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
