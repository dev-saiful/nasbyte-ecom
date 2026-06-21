import { type CartItem, useCartStore } from "@/stores/cart";

export function useCart() {
  const store = useCartStore();

  const addItem = (item: Omit<CartItem, "id">) => {
    store.addItem(item);
  };

  const removeItem = (productId: string, variantId?: string | null) => {
    store.removeItem(productId, variantId);
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => {
    if (quantity < 1) {
      removeItem(productId, variantId);
      return;
    }
    store.updateQuantity(productId, quantity, variantId);
  };

  const clearCart = () => {
    store.clearCart();
  };

  const totalItems = store.getTotalItems();
  const totalPrice = store.getTotalPrice();

  return {
    items: store.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
