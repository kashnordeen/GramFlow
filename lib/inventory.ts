import { PoolClient } from "pg";
import { StockBatch } from "@/types";

export interface FifoAllocation { batchId: number; grams: number; unitCost: number; }

export async function allocateFifo(client: PoolClient, gramsRequested: number, requestedBatchId?: number | null): Promise<FifoAllocation[]> {
  if (!Number.isFinite(gramsRequested) || gramsRequested <= 0) throw new Error("Sale quantity must be positive.");
  const locked = await client.query<StockBatch>(
    `SELECT * FROM stock_batches WHERE status='OPEN' AND remaining_grams>0 ORDER BY created_at,id FOR UPDATE`);
  if (requestedBatchId && locked.rows[0]?.id !== requestedBatchId) throw new Error("The selected batch is not the oldest available batch. FIFO allocation is required.");
  let remaining = gramsRequested;
  const allocations: FifoAllocation[] = [];
  for (const batch of locked.rows) {
    if (remaining <= 0) break;
    const grams = Math.min(remaining, batch.remaining_grams);
    const updated = await client.query(
      `UPDATE stock_batches SET remaining_grams=remaining_grams-$1,updated_at=now(),status=CASE WHEN remaining_grams-$1=0 THEN 'CLOSED' ELSE status END WHERE id=$2 AND remaining_grams>=$1 RETURNING id`, [grams, batch.id]);
    if (!updated.rows[0]) throw new Error("Inventory changed while allocating stock; retry the sale.");
    allocations.push({ batchId: batch.id, grams, unitCost: batch.price_per_gram });
    remaining = Math.round((remaining - grams) * 1000) / 1000;
  }
  if (remaining > 0) throw new Error(`Insufficient stock. Missing ${remaining.toFixed(3)}g.`);
  return allocations;
}
