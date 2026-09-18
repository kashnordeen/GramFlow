import "dotenv/config";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { allocateFifo } from "../lib/inventory";

const url = process.env.TEST_DATABASE_URL;
const schema = `gramflow_test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const admin = url ? new pg.Client({ connectionString: url }) : null;
const migration = async (name: string) => readFile(path.join(process.cwd(), "db", "migrations", name), "utf8");

test("PostgreSQL connects, migrations apply, and seed is deterministic", { skip: !url }, async () => {
  await admin!.connect();
  await admin!.query(`CREATE SCHEMA ${schema}`);
  await admin!.query(`SET search_path TO ${schema}`);
  await admin!.query(await migration("001_initial_postgresql.sql"));
  await admin!.query(await migration("002_integrity_triggers.sql"));
  await admin!.query(await migration("003_release_hardening.sql"));
  await admin!.query(await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8"));
  await admin!.query(await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8"));
  const result = await admin!.query("SELECT count(*)::int AS count FROM roles");
  assert.equal(result.rows[0].count, 4);
});

test("FIFO partially consumes oldest batch then continues", { skip: !url }, async () => {
  await admin!.query("TRUNCATE stock_batches RESTART IDENTITY CASCADE");
  await admin!.query("INSERT INTO stock_batches(grams,price_per_gram,remaining_grams,created_at) VALUES(3,10,3,now()-interval '1 day'),(5,20,5,now())");
  await admin!.query("BEGIN");
  const allocations = await allocateFifo(admin! as unknown as pg.PoolClient, 4);
  await admin!.query("COMMIT");
  assert.deepEqual(allocations.map((item) => item.grams), [3, 1]);
  const rows = await admin!.query("SELECT remaining_grams::float AS value FROM stock_batches ORDER BY id");
  assert.deepEqual(rows.rows.map((row) => row.value), [0, 4]);
});

test("FIFO rolls back on insufficient stock", { skip: !url }, async () => {
  await admin!.query("BEGIN");
  await assert.rejects(() => allocateFifo(admin! as unknown as pg.PoolClient, 10), /Insufficient stock/);
  await admin!.query("ROLLBACK");
  const value = await admin!.query("SELECT sum(remaining_grams)::float AS value FROM stock_batches");
  assert.equal(value.rows[0].value, 4);
});

test("concurrent FIFO allocations cannot oversell the same row", { skip: !url }, async () => {
  await admin!.query("TRUNCATE stock_batches RESTART IDENTITY CASCADE");
  await admin!.query("INSERT INTO stock_batches(grams,price_per_gram,remaining_grams) VALUES(10,10,10)");
  const a = new pg.Client({ connectionString: url! }); const b = new pg.Client({ connectionString: url! });
  await Promise.all([a.connect(), b.connect()]);
  await Promise.all([a.query(`SET search_path TO ${schema}`), b.query(`SET search_path TO ${schema}`)]);
  const consume = async (client: pg.Client) => {
    await client.query("BEGIN");
    try { await allocateFifo(client as unknown as pg.PoolClient, 6); await client.query("COMMIT"); return true; }
    catch { await client.query("ROLLBACK"); return false; }
  };
  const results = await Promise.all([consume(a), consume(b)]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal((await admin!.query("SELECT remaining_grams::float AS value FROM stock_batches")).rows[0].value, 4);
  await Promise.all([a.end(), b.end()]);
});

test("database rejects unbalanced journals and audit modification", { skip: !url }, async () => {
  const user = await admin!.query("INSERT INTO users(email,name,password_hash) VALUES('test@hemp.com','Test','hash') RETURNING id");
  const cash = (await admin!.query("SELECT id FROM accounts WHERE account_code='1000'")).rows[0].id;
  await admin!.query("BEGIN");
  const entry = await admin!.query("INSERT INTO journal_entries(entry_number,transaction_type,reference_type,reference_id,description,created_by) VALUES('TEST-1','TEST','test','1','bad',$1) RETURNING id", [user.rows[0].id]);
  await admin!.query("INSERT INTO journal_lines(journal_entry_id,account_id,debit,credit) VALUES($1,$2,10,0)", [entry.rows[0].id, cash]);
  await assert.rejects(() => admin!.query("COMMIT"), /balanced lines/);
  await admin!.query("ROLLBACK");
  const audit = await admin!.query("INSERT INTO audit_logs(action,entity_type) VALUES('test','test') RETURNING id");
  await assert.rejects(() => admin!.query("UPDATE audit_logs SET action='changed' WHERE id=$1", [audit.rows[0].id]), /immutable/);
});

test("database rejects empty journals and financial truncation", { skip: !url }, async () => {
  const user = (await admin!.query("SELECT id FROM users ORDER BY id LIMIT 1")).rows[0];
  await admin!.query("BEGIN");
  await admin!.query("INSERT INTO journal_entries(entry_number,transaction_type,reference_type,reference_id,description,created_by) VALUES('TEST-EMPTY','TEST','test','2','empty',$1)", [user.id]);
  await assert.rejects(() => admin!.query("COMMIT"), /balanced lines/);
  await admin!.query("ROLLBACK");
  await assert.rejects(() => admin!.query("TRUNCATE journal_entries CASCADE"), /cannot be truncated/);
});

after(async () => {
  if (admin && url) {
    try { await admin.query("RESET search_path"); await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); } finally { await admin.end(); }
  }
});
