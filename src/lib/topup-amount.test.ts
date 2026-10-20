import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateTopupAmount } from "./topup-amount";

describe("top-up amounts", () => {
  test("accepts a 0.56 EUR deposit", () => {
    assert.equal(validateTopupAmount(0.56), 0.56);
  });
  test("rejects a zero deposit", () => {
    assert.throws(() => validateTopupAmount(0));
  });
});