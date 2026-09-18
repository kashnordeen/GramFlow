import test from "node:test";
import assert from "node:assert/strict";
import { postJournal } from "../lib/accounting";
import type { PoolClient } from "pg";

test("postJournal rejects an unbalanced entry before writing", async () => {
  const client = { query: async () => { throw new Error("query should not run"); } } as unknown as PoolClient;
  await assert.rejects(() => postJournal(client, {
    transactionType: "TEST", referenceType: "test", referenceId: 1, description: "bad", createdBy: 1,
    lines: [{ accountCode: "1000", debit: 10 }, { accountCode: "4000", credit: 9 }],
  }), /unbalanced/);
});

test("postJournal writes one entry and balanced lines", async () => {
  const statements: string[] = [];
  const client = { query: async (sql: string) => {
    statements.push(sql);
    if (sql.includes("INSERT INTO journal_entries")) return { rows: [{ id: 42 }] };
    if (sql.includes("SELECT id FROM accounts")) return { rows: [{ id: 1 }] };
    return { rows: [] };
  } } as unknown as PoolClient;
  const id = await postJournal(client, {
    transactionType: "TEST", referenceType: "test", referenceId: 1, description: "balanced", createdBy: 1,
    lines: [{ accountCode: "1000", debit: 10 }, { accountCode: "4000", credit: 10 }],
  });
  assert.equal(id, 42);
  assert.equal(statements.filter((sql) => sql.includes("INSERT INTO journal_lines")).length, 2);
});
