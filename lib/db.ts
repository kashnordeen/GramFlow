import Database from 'better-sqlite3';
import path from 'path';

// Define DB path
// In production (Render/Railway), we use the mounted persistent volume at /app/data
// During development we keep it root-level
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join('/app/data', 'inventory.db')
  : path.join(process.cwd(), 'inventory.db');

let db: ReturnType<typeof Database> | null = null;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(database: ReturnType<typeof Database>) {
  // Users Table (Authentication)
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT 'Admin',
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add name column to existing users table
  try {
    database.exec(`ALTER TABLE users ADD COLUMN name TEXT DEFAULT 'Admin'`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Customers Table
  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      total_loan REAL DEFAULT 0.0,
      old_loan REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add old_loan column to existing customers table
  try {
    database.exec(`ALTER TABLE customers ADD COLUMN old_loan REAL DEFAULT 0.0`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Stock Batches Table
  database.exec(`
    CREATE TABLE IF NOT EXISTS stock_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grams REAL NOT NULL,
      price_per_gram REAL NOT NULL,
      remaining_grams REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales Table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      grams_sold REAL NOT NULL,
      gross_amount REAL NOT NULL,
      discount REAL DEFAULT 0.0,
      final_amount REAL NOT NULL,
      amount_received REAL NOT NULL,
      balance REAL NOT NULL, -- final_amount - amount_received. If > 0, it's a loan
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Migration: Add comments column to existing sales tables
  try {
    database.exec(`ALTER TABLE sales ADD COLUMN comments TEXT`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Sale Batch Assignments (Tracks WHICH exact batches a sale was deducted from for FIFO compliance)
  database.exec(`
    CREATE TABLE IF NOT EXISTS sale_batch_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      grams_deducted REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (batch_id) REFERENCES stock_batches(id)
    )
  `);

  // Payments Table
  database.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);
}
