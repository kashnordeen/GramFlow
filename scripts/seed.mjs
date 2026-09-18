import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8"));
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
    const user = await client.query(
      `INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3)
       ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [email, process.env.SEED_ADMIN_NAME || "Administrator", hash]);
    await client.query(`INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE name='ADMIN' ON CONFLICT DO NOTHING`, [user.rows[0].id]);
  }
  await client.query("COMMIT");
  console.log("seed complete");
} catch (error) { await client.query("ROLLBACK"); throw error; } finally { await client.end(); }
