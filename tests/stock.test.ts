import test from "node:test";
import assert from "node:assert/strict";
import { parseBatchReceipt } from "../lib/stock";

test("stock receipt accepts the total cost of the whole batch", () => {
  const formData = new FormData();
  formData.set("grams", "10.5");
  formData.set("total_cost", "8000.50");

  assert.deepEqual(parseBatchReceipt(formData), { grams: 10.5, totalCost: 8000.5 });

  formData.delete("total_cost");
  assert.deepEqual(parseBatchReceipt(formData), { error: "Enter a valid total batch cost." });

  formData.set("total_cost", "0");
  assert.deepEqual(parseBatchReceipt(formData), { error: "Enter a valid total batch cost." });

  formData.set("total_cost", "8000.005");
  assert.deepEqual(parseBatchReceipt(formData), { error: "Enter a valid total batch cost." });
});
