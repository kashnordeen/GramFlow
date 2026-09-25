import test from "node:test";
import assert from "node:assert/strict";
import { types } from "pg";
import "../lib/db";

test("PostgreSQL timestamps cross app boundaries as UTC ISO strings", () => {
  const timestamp = types.getTypeParser(1184, "text")("2026-09-25 10:00:00+05:30");

  assert.equal(timestamp, "2026-09-25T04:30:00.000Z");
  assert.equal(new Date(timestamp).toISOString(), "2026-09-25T04:30:00.000Z");
});
