import { describe, expect, it } from "vitest";
import {
  calculateCartTotal,
  calculateSubtotal,
  calculateTotal,
  SHIPPING_COST,
} from "./price";

describe("SHIPPING_COST", () => {
  it("should be 150 BDT", () => {
    expect(SHIPPING_COST).toBe(150);
  });
});

describe("calculateSubtotal", () => {
  it("should calculate subtotal for cart items", () => {
    const items = [
      { price: 500, quantity: 2 },
      { price: 300, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(1300);
  });

  it("should return 0 for empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("should handle single item", () => {
    const items = [{ price: 250, quantity: 3 }];
    expect(calculateSubtotal(items)).toBe(750);
  });
});

describe("calculateTotal", () => {
  it("should add shipping to subtotal", () => {
    expect(calculateTotal(1000)).toBe(1150);
  });

  it("should handle zero subtotal", () => {
    expect(calculateTotal(0)).toBe(150);
  });
});

describe("calculateCartTotal", () => {
  it("should calculate total from cart items", () => {
    const items = [
      { price: 500, quantity: 2 },
      { price: 300, quantity: 1 },
    ];
    expect(calculateCartTotal(items)).toEqual({
      subtotal: 1300,
      shipping: 150,
      total: 1450,
    });
  });
});
