import "dotenv/config";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { allocateFifo } from "../lib/inventory";
import { loadDashboardMetrics } from "../lib/dashboard";
import { loadStockBatches } from "../lib/stock";

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
  await admin!.query(await migration("004_google_identity.sql"));
  const legacyBatch = await admin!.query<{ id: number }>(
    "INSERT INTO stock_batches(grams,price_per_gram,remaining_grams) VALUES(10,800,10) RETURNING id",
  );
  await admin!.query(await migration("005_total_batch_cost.sql"));
  const converted = await admin!.query<{ total_cost: number }>("SELECT total_cost FROM stock_batches WHERE id=$1", [legacyBatch.rows[0].id]);
  assert.equal(Number(converted.rows[0].total_cost), 8000);
  await admin!.query(await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8"));
  await admin!.query(await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8"));
  const result = await admin!.query("SELECT count(*)::int AS count FROM roles");
  assert.equal(result.rows[0].count, 4);
});

test("FIFO partially consumes oldest batch then continues", { skip: !url }, async () => {
  await admin!.query("TRUNCATE stock_batches RESTART IDENTITY CASCADE");
  await admin!.query("INSERT INTO stock_batches(grams,total_cost,remaining_grams,created_at) VALUES(3,30,3,now()-interval '1 day'),(5,100,5,now())");
  await admin!.query("BEGIN");
  const allocations = await allocateFifo(admin! as unknown as pg.PoolClient, 4);
  await admin!.query("COMMIT");
  assert.deepEqual(allocations.map((item) => item.grams), [3, 1]);
  assert.deepEqual(allocations.map((item) => item.unitCost), [10, 20]);
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
  await admin!.query("INSERT INTO stock_batches(grams,total_cost,remaining_grams) VALUES(10,100,10)");
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

test("dashboard metrics use posted sales and aggregate FIFO costs once per sale", { skip: !url }, async () => {
  await admin!.query("TRUNCATE customers,stock_batches RESTART IDENTITY CASCADE");
  const customer = await admin!.query<{ id: number }>(
    "INSERT INTO customers(name,total_loan) VALUES('Dashboard Customer',50) RETURNING id",
  );
  const batches = await admin!.query<{ id: number }>(`
    INSERT INTO stock_batches(grams,total_cost,remaining_grams,created_at)
    VALUES
      (10,100,6,now()-interval '3 days'),
      (10,200,8,now()-interval '2 days'),
      (10,100,9,now()-interval '1 day')
    RETURNING id
  `);
  const todaySale = await admin!.query<{ id: number }>(`
    INSERT INTO sales(customer_id,grams_sold,gross_amount,final_amount,amount_received,balance)
    VALUES($1,4,100,100,100,0)
    RETURNING id
  `, [customer.rows[0].id]);
  const yesterdaySale = await admin!.query<{ id: number }>(`
    INSERT INTO sales(customer_id,grams_sold,gross_amount,final_amount,amount_received,balance,created_at)
    VALUES($1,2,80,80,80,0,CURRENT_DATE-interval '1 day')
    RETURNING id
  `, [customer.rows[0].id]);
  await admin!.query(`
    INSERT INTO sales(customer_id,grams_sold,gross_amount,final_amount,amount_received,balance,status)
    VALUES($1,1,999,999,999,0,'REVERSED')
  `, [customer.rows[0].id]);
  await admin!.query(`
    INSERT INTO sale_batch_assignments(sale_id,batch_id,grams_deducted,unit_cost)
    VALUES
      ($1,$3,2,10),
      ($1,$4,2,20),
      ($2,$5,2,10)
  `, [
    todaySale.rows[0].id,
    yesterdaySale.rows[0].id,
    batches.rows[0].id,
    batches.rows[1].id,
    batches.rows[2].id,
  ]);

  let queryQueue: Promise<unknown> = Promise.resolve();
  const runSerialQuery = <T extends pg.QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<pg.QueryResult<T>> => {
    const result = queryQueue.then(() => admin!.query<T>(text, [...values]));
    queryQueue = result.then(() => undefined, () => undefined);
    return result;
  };
  const metrics = await loadDashboardMetrics(runSerialQuery, 7);

  assert.equal(metrics.salesToday.amount, 100);
  assert.equal(metrics.salesToday.previousAmount, 80);
  assert.equal(metrics.grossProfit.amount, 100);
  assert.equal(metrics.grossProfit.revenue, 180);
  assert.equal(metrics.stock.totalGrams, 23);
  assert.equal(metrics.stock.openBatchCount, 3);
  assert.equal(metrics.receivables.total, 50);
  assert.equal(metrics.recentSales.length, 2);
  assert.equal(metrics.trend.reduce((sum, point) => sum + point.sales, 0), 180);
  assert.equal(metrics.trend.reduce((sum, point) => sum + point.profit, 0), 100);
});

test("stock revenue and profit include only posted sales and their original unit cost", { skip: !url }, async () => {
  await admin!.query("TRUNCATE customers,stock_batches RESTART IDENTITY CASCADE");
  const customer = await admin!.query<{ id: number }>("INSERT INTO customers(name) VALUES('Margin Customer') RETURNING id");
  const batch = await admin!.query<{ id: number }>(
    "INSERT INTO stock_batches(grams,total_cost,remaining_grams) VALUES(10,800,8) RETURNING id",
  );
  const unsold = await admin!.query<{ id: number }>(
    "INSERT INTO stock_batches(grams,total_cost,remaining_grams) VALUES(5,500,5) RETURNING id",
  );
  const sale = await admin!.query<{ id: number }>(
    "INSERT INTO sales(customer_id,grams_sold,gross_amount,discount,final_amount,amount_received,balance) VALUES($1,2,200,20,180,180,0) RETURNING id",
    [customer.rows[0].id],
  );
  await admin!.query(
    "INSERT INTO sale_batch_assignments(sale_id,batch_id,grams_deducted,unit_cost) VALUES($1,$2,2,80)",
    [sale.rows[0].id, batch.rows[0].id],
  );

  const stockQuery = <T extends pg.QueryResultRow>(text: string, values: readonly unknown[] = []) =>
    admin!.query<T>(text, [...values]);
  let batches = await loadStockBatches(stockQuery);
  let soldBatch = batches.find((item) => item.id === batch.rows[0].id)!;
  const unsoldBatch = batches.find((item) => item.id === unsold.rows[0].id)!;

  assert.equal(soldBatch.total_cost, 800);
  assert.equal(soldBatch.total_revenue, 180);
  assert.equal(soldBatch.realized_cost, 160);
  assert.equal(soldBatch.total_revenue! - soldBatch.realized_cost!, 20);
  assert.equal(unsoldBatch.total_revenue, 0);
  assert.equal(unsoldBatch.realized_cost, 0);

  await admin!.query("UPDATE stock_batches SET total_cost=900 WHERE id=$1", [batch.rows[0].id]);
  batches = await loadStockBatches(stockQuery);
  soldBatch = batches.find((item) => item.id === batch.rows[0].id)!;
  assert.equal(soldBatch.total_cost, 900);
  assert.equal(soldBatch.realized_cost, 160);

  await admin!.query("UPDATE sales SET status='REVERSED' WHERE id=$1", [sale.rows[0].id]);
  batches = await loadStockBatches(stockQuery);
  soldBatch = batches.find((item) => item.id === batch.rows[0].id)!;
  assert.equal(soldBatch.total_revenue, 0);
  assert.equal(soldBatch.realized_cost, 0);
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
