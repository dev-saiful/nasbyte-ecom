export const SHIPPING_COST = 150;

export function calculateSubtotal(
  items: { price: { toString(): string }; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
}

export function calculateTotal(subtotal: number): number {
  return subtotal + SHIPPING_COST;
}

export function calculateCartTotal(
  items: { price: { toString(): string }; quantity: number }[],
): { subtotal: number; shipping: number; total: number } {
  const subtotal = calculateSubtotal(items);
  const total = calculateTotal(subtotal);
  return { subtotal, shipping: SHIPPING_COST, total };
}
