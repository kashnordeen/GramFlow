import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!process.env.DEMO_SEED_PASSWORD || process.env.DEMO_SEED_PASSWORD.length < 10) throw new Error("DEMO_SEED_PASSWORD must be at least 10 characters");
const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "hemp.com").replace(/^@/, "");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  await client.query("BEGIN");
  if ((await client.query("SELECT 1 FROM audit_logs WHERE action='demo.seed' LIMIT 1")).rows[0]) {
    await client.query("ROLLBACK");
    console.log("demo data already exists");
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash(process.env.DEMO_SEED_PASSWORD, 12);
  const users = {};
  for (const [key, name, role] of [["admin","Demo Admin","ADMIN"],["manager","Demo Manager","MANAGER"],["inventory","Demo Inventory","INVENTORY_OPERATOR"],["accountant","Demo Accountant","ACCOUNTANT"]]) {
    const email = `${key}@${domain}`;
    const user = await client.query(`INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3)
      ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,is_active=TRUE RETURNING id`, [email, name, passwordHash]);
    users[key] = user.rows[0].id;
    await client.query("DELETE FROM user_roles WHERE user_id=$1", [users[key]]);
    await client.query("INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE name=$2", [users[key], role]);
  }
  const accountRows = await client.query("SELECT account_code,id FROM accounts");
  const accounts = Object.fromEntries(accountRows.rows.map((row) => [row.account_code, row.id]));
  const post = async (number, type, referenceType, referenceId, description, lines) => {
    const entry = await client.query(`INSERT INTO journal_entries(entry_number,transaction_type,reference_type,reference_id,description,created_by)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id`, [number, type, referenceType, String(referenceId), description, users.admin]);
    for (const line of lines) await client.query("INSERT INTO journal_lines(journal_entry_id,account_id,debit,credit,description) VALUES($1,$2,$3,$4,$5)",
      [entry.rows[0].id, accounts[line.code], line.debit || 0, line.credit || 0, "Demo fixture"]);
    return entry.rows[0].id;
  };
  const alice = (await client.query("INSERT INTO customers(name,phone,old_loan) VALUES('Alice Demo','555-0101',150) RETURNING id")).rows[0].id;
  await client.query("INSERT INTO customers(name,phone) VALUES('Bob Demo','555-0102'),('Charlie Demo','555-0103')");
  await post("DEMO-OPEN-AR", "OPENING_RECEIVABLE", "customer", alice, "Demo opening receivable", [{ code: "1100", debit: 150 }, { code: "3000", credit: 150 }]);
  const batch1 = (await client.query("INSERT INTO stock_batches(grams,price_per_gram,remaining_grams,created_at) VALUES(10,300,6,now()-interval '2 days') RETURNING id")).rows[0].id;
  const batch2 = (await client.query("INSERT INTO stock_batches(grams,price_per_gram,remaining_grams,created_at) VALUES(8,320,8,now()-interval '1 day') RETURNING id")).rows[0].id;
  await post("DEMO-STOCK-1", "STOCK_RECEIPT", "stock_batch", batch1, "Demo stock receipt", [{ code: "1200", debit: 3000 }, { code: "3000", credit: 3000 }]);
  await post("DEMO-STOCK-2", "STOCK_RECEIPT", "stock_batch", batch2, "Demo stock receipt", [{ code: "1200", debit: 2560 }, { code: "3000", credit: 2560 }]);
  const sale = (await client.query(`INSERT INTO sales(customer_id,grams_sold,gross_amount,discount,final_amount,amount_received,balance,comments,created_by)
    VALUES($1,4,4000,200,3800,2000,1800,'Demonstration FIFO sale',$2) RETURNING id`, [alice, users.manager])).rows[0].id;
  await client.query("INSERT INTO sale_batch_assignments(sale_id,batch_id,grams_deducted,unit_cost) VALUES($1,$2,4,300)", [sale, batch1]);
  await client.query("UPDATE customers SET total_loan=1800 WHERE id=$1", [alice]);
  await post("DEMO-SALE-REV", "SALE_REVENUE", "sale", sale, "Demo sale revenue", [{ code: "1000", debit: 2000 }, { code: "1100", debit: 1800 }, { code: "4000", credit: 3800 }]);
  await post("DEMO-SALE-COGS", "SALE_COGS", "sale", sale, "Demo sale inventory cost", [{ code: "5000", debit: 1200 }, { code: "1200", credit: 1200 }]);
  const payment = (await client.query("INSERT INTO payments(customer_id,amount,created_by) VALUES($1,500,$2) RETURNING id", [alice, users.accountant])).rows[0].id;
  await client.query("UPDATE customers SET old_loan=0,total_loan=1450 WHERE id=$1", [alice]);
  await post("DEMO-PAYMENT", "CUSTOMER_PAYMENT", "payment", payment, "Demo customer payment", [{ code: "1000", debit: 500 }, { code: "1100", credit: 500 }]);
  await client.query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES
    ($1,'stock.create','stock_batch',$2,'{"demo":true}'),($1,'stock.create','stock_batch',$3,'{"demo":true}'),
    ($4,'sale.create','sale',$5,'{"demo":true}'),($6,'payment.create','payment',$7,'{"demo":true}'),
    ($1,'demo.seed','system',NULL,$8::jsonb)`, [users.admin, String(batch1), String(batch2), users.manager, String(sale), users.accountant, String(payment), JSON.stringify({ accounts: Object.keys(users).map((key) => `${key}@${domain}`) })]);
  await client.query("COMMIT");
  console.log(`demo data created for ${domain}; use DEMO_SEED_PASSWORD to sign in`);
} catch (error) { await client.query("ROLLBACK"); throw error; } finally { await client.end(); }
