import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateTopupAmount } from "./topup-amount";

describe("top-up amounts", () => {
  test("accepts the hidden 3.30 EUR minimum", () => {
    assert.equal(validateTopupAmount(3.3), 3.3);
    assert.equal(validateTopupAmount(3.31), 3.31);
    assert.equal(validateTopupAmount(20), 20);
  });
  test("rejects a deposit below the hidden 3.30 EUR minimum", () => {
    assert.throws(() => validateTopupAmount(3.29));
    assert.throws(() => validateTopupAmount(2));
  });
  test("error message does not reveal the hidden minimum", () => {
    try {
      validateTopupAmount(3.29);
      assert.fail("should throw");
    } catch (err) {
      assert.doesNotMatch(String((err as Error).message), /3[.,]30/);
    }
  });
  test("rejects a zero deposit", () => {
    assert.throws(() => validateTopupAmount(0));
  });
});
