import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateTopupAmount } from "./topup-amount";

describe("top-up amounts", () => {
  test("accepts an 8 EUR deposit", () => {
    assert.equal(validateTopupAmount(8), 8);
  });
  test("rejects a deposit below the 8 EUR minimum", () => {
    assert.throws(() => validateTopupAmount(7.99));
    assert.throws(() => validateTopupAmount(0.56));
  });
  test("rejects a zero deposit", () => {
    assert.throws(() => validateTopupAmount(0));
  });
});
