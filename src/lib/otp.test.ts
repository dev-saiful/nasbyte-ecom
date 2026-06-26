import { describe, expect, it } from "vitest";
import { generateOtp, hashOtp, verifyOtp } from "./otp";

describe("generateOtp", () => {
  it("should generate a 6-digit string", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("should generate different OTPs on each call", () => {
    const otp1 = generateOtp();
    const otp2 = generateOtp();
    expect(otp1).not.toBe(otp2);
  });
});

describe("hashOtp", () => {
  it("should return a hashed string", async () => {
    const hash = await hashOtp("123456");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("123456");
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe("verifyOtp", () => {
  it("should return valid for matching OTP", async () => {
    const hash = await hashOtp("123456");
    const result = await verifyOtp("123456", hash);
    expect(result.valid).toBe(true);
  });

  it("should return invalid for non-matching OTP", async () => {
    const hash = await hashOtp("123456");
    const result = await verifyOtp("654321", hash);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid OTP");
  });
});
