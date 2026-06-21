import type { Decimal } from "@prisma/client/runtime/library";

export const SHIPPING_COST = 150;

export function calculateSubtotal(
  items: { price: Decimal; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
}

export function calculateTotal(subtotal: number): number {
  return subtotal + SHIPPING_COST;
}
