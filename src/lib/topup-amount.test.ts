import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateTopupAmount } from "./topup-amount";

describe("top-up amounts", () => {
  test("accepts a 7 EUR deposit", () => {
    assert.equal(validateTopupAmount(7), 7);
  });
  test("rejects a deposit below the 7 EUR minimum", () => {
    assert.throws(() => validateTopupAmount(6.99));
    assert.throws(() => validateTopupAmount(0.56));
  });
  test("rejects a zero deposit", () => {
    assert.throws(() => validateTopupAmount(0));
  });
});
