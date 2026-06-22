"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { OrderNotes } from "@/components/checkout/order-notes";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaymentMethod } from "@/components/checkout/payment-method";
import { PlaceOrderButton } from "@/components/checkout/place-order-button";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { useCart } from "@/hooks/use-cart";
import { type CheckoutInput, checkoutSchema } from "@/lib/validators";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: "",
      shippingCity: "",
      shippingPostalCode: "",
      shippingPhone: "",
      paymentMethod: "CASH_ON_DELIVERY",
      notes: "",
    },
  });

  const onSubmit = async (data: CheckoutInput) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process checkout");
      }

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/orders/${result.orderId}/confirmation`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process checkout",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold">Checkout</h1>
        <p className="mt-4 text-muted-foreground">
          Your cart is empty.{" "}
          <a href="/products" className="text-primary hover:underline">
            Continue shopping
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Checkout</h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ShippingForm form={form} />
            <PaymentMethod form={form} />
            <OrderNotes form={form} />
          </div>
          <div className="space-y-6">
            <OrderSummary />
            <PlaceOrderButton isLoading={isLoading} disabled={false} />
          </div>
        </div>
      </form>
    </div>
  );
}
