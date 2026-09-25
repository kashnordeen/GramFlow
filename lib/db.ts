import { Pool, PoolClient, QueryResult, QueryResultRow, types } from "pg";

types.setTypeParser(1700, (value) => Number(value));
types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(1184, (value) => new Date(value).toISOString());

const globalForDb = globalThis as unknown as { gramflowPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.");
  }
  return new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

export function getDb(): Pool {
  if (!globalForDb.gramflowPool) globalForDb.gramflowPool = createPool();
  return globalForDb.gramflowPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
  return getDb().query<T>(text, [...values]);
}

export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>, isolationLevel: "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE" = "READ COMMITTED"): Promise<T> {
  const client = await getDb().connect();
  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  if (globalForDb.gramflowPool) {
    await globalForDb.gramflowPool.end();
    delete globalForDb.gramflowPool;
  }
}
