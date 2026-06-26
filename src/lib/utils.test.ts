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

  it("strips non-ASCII characters", () => {
    expect(slugify("সিল্ক স্কার্ফ")).toBe("");
  });

  it("does not collapse consecutive dashes", () => {
    expect(slugify("hello---world")).toBe("hello---world");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
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
