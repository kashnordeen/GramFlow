import test from "node:test";
import assert from "node:assert/strict";
import { grossForGrams, validMoney, validateRanges } from "../lib/pricing";

test("custom gram ranges apply only inside their bounds and zero is a valid rate", () => {
  const ranges = [{ min_grams: 0.25, max_grams: 0.30, amount: 0 }];
  assert.equal(validateRanges(ranges), null);
  assert.equal(validMoney(0.29), true);
  assert.equal(grossForGrams(0.25, 100, ranges), 0);
  assert.equal(grossForGrams(0.30, 100, ranges), 0);
  assert.equal(grossForGrams(0.31, 100, ranges), 31);
  assert.match(validateRanges([...ranges, { min_grams: 0.30, max_grams: 0.40, amount: 20 }])!, /overlap/);
});
