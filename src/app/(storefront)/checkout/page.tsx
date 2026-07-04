"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const { items, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = !!session?.user;

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: "",
      shippingCity: "",
      shippingPostalCode: "",
      shippingPhone: "",
      paymentMethod: "CASH_ON_DELIVERY",
      notes: "",
      guestName: "",
      guestEmail: "",
    },
  });

  const onSubmit = async (data: CheckoutInput) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...data,
        cartItems: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      {!isLoggedIn && (
        <p className="mt-2 text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Log in
          </a>{" "}
          for a faster checkout.
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {!isLoggedIn && (
              <div className="space-y-4 rounded-lg border p-4">
                <h2 className="font-heading text-lg font-semibold">
                  Contact Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="guestName"
                      className="text-sm font-medium leading-none"
                    >
                      Full Name *
                    </label>
                    <input
                      id="guestName"
                      {...form.register("guestName", {
                        validate: (v) =>
                          isLoggedIn || !!v || "Name is required",
                      })}
                      placeholder="John Doe"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    {form.formState.errors.guestName && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.guestName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="guestEmail"
                      className="text-sm font-medium leading-none"
                    >
                      Email (optional)
                    </label>
                    <input
                      id="guestEmail"
                      type="email"
                      {...form.register("guestEmail")}
                      placeholder="john@example.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      For order confirmation only.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
