import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateTopupAmount } from "./topup-amount";

describe("top-up amounts", () => {
  test("accepts a 20 EUR deposit", () => {
    assert.equal(validateTopupAmount(20), 20);
  });
  test("rejects a deposit below the 20 EUR minimum", () => {
    assert.throws(() => validateTopupAmount(19.99));
    assert.throws(() => validateTopupAmount(0.56));
  });
  test("rejects a zero deposit", () => {
    assert.throws(() => validateTopupAmount(0));
  });
});
