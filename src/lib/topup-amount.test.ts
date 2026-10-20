import { describe, expect, test } from "bun:test";
import { validateTopupAmount } from "./topup-amount";

describe("top-up amounts", () => {
  test("accepts a 0.56 EUR deposit", () => {
    expect(validateTopupAmount(0.56)).toBe(0.56);
  });
  test("rejects a zero deposit", () => {
    expect(() => validateTopupAmount(0)).toThrow();
  });
});