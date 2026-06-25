import { type CartItem, useCartStore } from "@/stores/cart";

export function useCart() {
  const store = useCartStore();

  const addItem = (item: Omit<CartItem, "id">) => {
    store.addItem(item);
  };

  const removeItem = (variantId: string) => {
    store.removeItem(variantId);
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(variantId);
      return;
    }
    store.updateQuantity(variantId, quantity);
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
