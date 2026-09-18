import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import path from "node:path";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sqlitePath = path.resolve(process.env.SQLITE_PATH || "inventory.db");
const source = new DatabaseSync(sqlitePath, { readOnly: true });
const target = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
const tables = ["users", "customers", "stock_batches", "sales", "sale_batch_assignments", "payments", "settings"];
const columns = {
  users: ["id","email","name","password_hash","created_at"], customers: ["id","name","phone","total_loan","old_loan","created_at"],
  stock_batches: ["id","grams","price_per_gram","remaining_grams","created_at"],
  sales: ["id","customer_id","grams_sold","gross_amount","discount","final_amount","amount_received","balance","comments","created_at"],
  sale_batch_assignments: ["id","sale_id","batch_id","grams_deducted"], payments: ["id","customer_id","amount","created_at"],
  settings: ["id","rate_per_gram","special_025_030","special_050_060","updated_at"],
};
await target.connect();
try {
  await target.query("BEGIN");
  for (const table of tables) {
    const exists = source.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!exists) continue;
    const sourceColumns = new Set(source.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
    const selected = columns[table].filter((name) => sourceColumns.has(name));
    const rows = source.prepare(`SELECT ${selected.join(",")} FROM ${table}`).all();
    for (const row of rows) {
      const names = [...selected];
      const values = names.map((name) => row[name]);
      if (table === "stock_batches") { names.push("status"); values.push(Number(row.remaining_grams) > 0 ? "OPEN" : "CLOSED"); }
      if (table === "sale_batch_assignments") {
        names.push("unit_cost");
        const batch = source.prepare("SELECT price_per_gram FROM stock_batches WHERE id=?").get(row.batch_id);
        values.push(batch?.price_per_gram ?? 0);
      }
      await target.query(`INSERT INTO ${table} (${names.join(",")}) VALUES (${names.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT DO NOTHING`, values);
    }
    const count = await target.query(`SELECT count(*)::int AS count FROM ${table}`);
    if (count.rows[0].count < rows.length) throw new Error(`${table}: target row count is smaller than source`);
    console.log(`${table}: source=${rows.length}, target=${count.rows[0].count}`);
  }
  for (const table of tables.filter((name) => name !== "settings")) {
    await target.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), COALESCE((SELECT max(id) FROM ${table}),1), true)`);
  }
  const actor = (await target.query("SELECT id FROM users ORDER BY id LIMIT 1")).rows[0];
  if (!actor) throw new Error("At least one imported or seeded user is required to attribute migrated journals");
  const accounts = Object.fromEntries((await target.query("SELECT account_code,id FROM accounts")).rows.map((row) => [row.account_code, row.id]));
  const post = async (number, type, referenceType, referenceId, description, lines) => {
    if ((await target.query("SELECT 1 FROM journal_entries WHERE entry_number=$1", [number])).rows[0]) return;
    const entry = await target.query(`INSERT INTO journal_entries(entry_number,transaction_type,reference_type,reference_id,description,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
      [number, type, referenceType, String(referenceId), description, actor.id]);
    for (const line of lines.filter((item) => item.debit > 0 || item.credit > 0)) {
      await target.query("INSERT INTO journal_lines(journal_entry_id,account_id,debit,credit,description) VALUES($1,$2,$3,$4,$5)",
        [entry.rows[0].id, accounts[line.code], line.debit || 0, line.credit || 0, "Migrated from SQLite"]);
    }
  };
  const batches = (await target.query("SELECT * FROM stock_batches ORDER BY id")).rows;
  for (const batch of batches) {
    const value = Math.round(Number(batch.grams) * Number(batch.price_per_gram) * 100) / 100;
    if (value > 0) await post(`MIG-STOCK-${batch.id}`, "MIGRATED_STOCK_RECEIPT", "stock_batch", batch.id, `Migrated stock batch #${batch.id}`,
      [{ code: "1200", debit: value, credit: 0 }, { code: "3000", debit: 0, credit: value }]);
  }
  const sales = (await target.query("SELECT * FROM sales ORDER BY id")).rows;
  for (const sale of sales) {
    const finalAmount = Number(sale.final_amount), received = Number(sale.amount_received), balance = Number(sale.balance);
    if (finalAmount > 0) await post(`MIG-SALE-${sale.id}`, "MIGRATED_SALE_REVENUE", "sale", sale.id, `Migrated sale #${sale.id}`,
      [{ code: "1000", debit: received, credit: 0 }, { code: "1100", debit: balance, credit: 0 }, { code: "4000", debit: 0, credit: finalAmount }]);
    const cost = Number((await target.query("SELECT COALESCE(sum(grams_deducted*unit_cost),0)::numeric AS value FROM sale_batch_assignments WHERE sale_id=$1", [sale.id])).rows[0].value);
    if (cost > 0) await post(`MIG-COGS-${sale.id}`, "MIGRATED_SALE_COGS", "sale", sale.id, `Migrated inventory cost for sale #${sale.id}`,
      [{ code: "5000", debit: cost, credit: 0 }, { code: "1200", debit: 0, credit: cost }]);
  }
  const payments = (await target.query("SELECT * FROM payments ORDER BY id")).rows;
  for (const payment of payments) {
    const amount = Number(payment.amount);
    await post(`MIG-PAY-${payment.id}`, "MIGRATED_CUSTOMER_PAYMENT", "payment", payment.id, `Migrated payment #${payment.id}`,
      [{ code: "1000", debit: amount, credit: 0 }, { code: "1100", debit: 0, credit: amount }]);
  }
  const expectedAr = Number((await target.query("SELECT COALESCE(sum(total_loan+old_loan),0)::numeric AS value FROM customers")).rows[0].value);
  const ledgerAr = Number((await target.query("SELECT COALESCE(sum(jl.debit-jl.credit),0)::numeric AS value FROM journal_lines jl JOIN accounts a ON a.id=jl.account_id WHERE a.account_code='1100'")).rows[0].value);
  const arDelta = Math.round((expectedAr - ledgerAr) * 100) / 100;
  if (arDelta !== 0) await post("MIG-AR-RECONCILIATION", "MIGRATED_AR_RECONCILIATION", "migration", 1, "Reconcile imported customer balances",
    arDelta > 0 ? [{ code: "1100", debit: arDelta, credit: 0 }, { code: "3000", debit: 0, credit: arDelta }]
      : [{ code: "3000", debit: -arDelta, credit: 0 }, { code: "1100", debit: 0, credit: -arDelta }]);
  const broken = await target.query(`
    SELECT (SELECT count(*) FROM sales s LEFT JOIN customers c ON c.id=s.customer_id WHERE c.id IS NULL)
         + (SELECT count(*) FROM sale_batch_assignments a LEFT JOIN sales s ON s.id=a.sale_id LEFT JOIN stock_batches b ON b.id=a.batch_id WHERE s.id IS NULL OR b.id IS NULL)
         + (SELECT count(*) FROM payments p LEFT JOIN customers c ON c.id=p.customer_id WHERE c.id IS NULL) AS count`);
  if (Number(broken.rows[0].count) !== 0) throw new Error("Referential-integrity validation failed");
  await target.query("COMMIT");
  console.log(`SQLite import completed from ${sqlitePath}; source file was not modified.`);
} catch (error) { await target.query("ROLLBACK"); throw error; } finally { source.close(); await target.end(); }
