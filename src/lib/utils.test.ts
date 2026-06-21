import { describe, expect, it } from "vitest";
import { formatBDT, generateOrderNumber, slugify } from "./utils";

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Silk Scarf Collection")).toBe("silk-scarf-collection");
  });

  it("handles special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });
});

describe("generateOrderNumber", () => {
  it("starts with ORD-", () => {
    expect(generateOrderNumber()).toMatch(/^ORD-/);
  });

  it("has 14 characters total", () => {
    expect(generateOrderNumber()).toHaveLength(14);
  });
});

describe("formatBDT", () => {
  it("formats number as BDT", () => {
    expect(formatBDT(1500)).toContain("1,500");
  });
});
