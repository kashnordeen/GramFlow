"use server";

import { query, withTransaction } from "../db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/authorization";
import { writeAuditLog } from "../audit";
import { postJournal } from "../accounting";
import { StockBatch, ActionResult } from "@/types";

const refresh = () => { revalidatePath("/"); revalidatePath("/stock"); revalidatePath("/add-sale"); revalidatePath("/audit"); };

export async function getStockBatches(): Promise<StockBatch[]> {
  await requirePermission("inventory.read");
  return (await query<StockBatch>(`
    SELECT sb.*,sb.grams*sb.price_per_gram AS total_cost,
      COALESCE(SUM(CASE WHEN s.status='POSTED' THEN a.grams_deducted*(s.final_amount/NULLIF(s.grams_sold,0)) ELSE 0 END),0) AS total_revenue
    FROM stock_batches sb LEFT JOIN sale_batch_assignments a ON a.batch_id=sb.id LEFT JOIN sales s ON s.id=a.sale_id
    GROUP BY sb.id ORDER BY sb.created_at DESC,sb.id DESC`)).rows;
}

export async function getTotalStock(): Promise<number> {
  await requirePermission("inventory.read");
  return (await query<{ total: number }>("SELECT COALESCE(sum(remaining_grams),0) AS total FROM stock_batches WHERE status='OPEN'")).rows[0].total;
}

export async function addStockBatch(formData: FormData): Promise<ActionResult> {
  const grams = Number(formData.get("grams"));
  const price = Number(process.env.COST_PRICE_PER_GRAM || 0);
  if (!Number.isFinite(grams) || grams <= 0) return { error: "Invalid grams amount" };
  if (!Number.isFinite(price) || price <= 0) return { error: "COST_PRICE_PER_GRAM environment variable is not set correctly." };
  try {
    const actor = await requirePermission("inventory.create");
    await withTransaction(async (client) => {
      const batch = await client.query<{ id: number }>("INSERT INTO stock_batches(grams,price_per_gram,remaining_grams) VALUES($1,$2,$1) RETURNING id", [grams, price]);
      const value = Math.round(grams * price * 100) / 100;
      const journalId = await postJournal(client, { transactionType: "STOCK_RECEIPT", referenceType: "stock_batch", referenceId: batch.rows[0].id,
        description: `Stock receipt batch #${batch.rows[0].id}`, createdBy: actor.id,
        lines: [{ accountCode: "1200", debit: value }, { accountCode: "3000", credit: value }] });
      await writeAuditLog(client, { userId: actor.id, action: "stock.create", entityType: "stock_batch", entityId: batch.rows[0].id, metadata: { grams, pricePerGram: price } });
      await writeAuditLog(client, { userId: actor.id, action: "accounting.post", entityType: "stock_batch", entityId: batch.rows[0].id, metadata: { journalId } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Stock creation failed" }; }
}

export async function deleteStockBatch(batchId: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("inventory.delete");
    await withTransaction(async (client) => {
      const batch = (await client.query<StockBatch>("SELECT * FROM stock_batches WHERE id=$1 FOR UPDATE", [batchId])).rows[0];
      if (!batch) throw new Error("Batch not found.");
      if (batch.grams !== batch.remaining_grams) throw new Error("A batch with sale allocations cannot be deleted; close or reverse related sales first.");
      const value = Math.round(batch.remaining_grams * batch.price_per_gram * 100) / 100;
      const journalId = value > 0 ? await postJournal(client, { transactionType: "STOCK_REMOVAL", referenceType: "stock_batch", referenceId: batchId,
        description: `Removal of unused batch #${batchId}`, createdBy: actor.id,
        lines: [{ accountCode: "3000", debit: value }, { accountCode: "1200", credit: value }] }) : null;
      await client.query("DELETE FROM stock_batches WHERE id=$1", [batchId]);
      await writeAuditLog(client, { userId: actor.id, action: "stock.delete", entityType: "stock_batch", entityId: batchId, metadata: { grams: batch.grams, pricePerGram: batch.price_per_gram } });
      if (journalId) await writeAuditLog(client, { userId: actor.id, action: "accounting.post", entityType: "stock_batch", entityId: batchId, metadata: { journalId } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Stock deletion failed" }; }
}

export async function closeStockBatch(batchId: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("inventory.update");
    await withTransaction(async (client) => {
      const batch = (await client.query<StockBatch>("SELECT * FROM stock_batches WHERE id=$1 FOR UPDATE", [batchId])).rows[0];
      if (!batch) throw new Error("Batch not found.");
      const value = Math.round(batch.remaining_grams * batch.price_per_gram * 100) / 100;
      const journalId = value > 0 ? await postJournal(client, { transactionType: "INVENTORY_WRITE_OFF", referenceType: "stock_batch", referenceId: batchId,
        description: `Inventory write-off batch #${batchId}`, createdBy: actor.id,
        lines: [{ accountCode: "5100", debit: value }, { accountCode: "1200", credit: value }] }) : null;
      await client.query("UPDATE stock_batches SET remaining_grams=0,status='CLOSED',updated_at=now() WHERE id=$1", [batchId]);
      await writeAuditLog(client, { userId: actor.id, action: "stock.close", entityType: "stock_batch", entityId: batchId, metadata: { discardedGrams: batch.remaining_grams } });
      if (journalId) await writeAuditLog(client, { userId: actor.id, action: "accounting.post", entityType: "stock_batch", entityId: batchId, metadata: { journalId } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Stock close failed" }; }
}

export async function updateStockBatch(batchId: number, formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requirePermission("inventory.update");
    await withTransaction(async (client) => {
      const batch = (await client.query<StockBatch>("SELECT * FROM stock_batches WHERE id=$1 FOR UPDATE", [batchId])).rows[0];
      if (!batch) throw new Error("Batch not found.");
      const grams = formData.get("grams") !== null ? Number(formData.get("grams")) : batch.grams;
      const price = formData.get("price_per_gram") !== null ? Number(formData.get("price_per_gram")) : batch.price_per_gram;
      const sold = batch.grams - batch.remaining_grams;
      if (!Number.isFinite(grams) || grams <= 0 || grams < sold || !Number.isFinite(price) || price < 0) throw new Error(`Batch cannot be smaller than its sold quantity (${sold.toFixed(3)}g).`);
      const newRemaining = grams - sold;
      const valueDelta = Math.round((newRemaining * price - batch.remaining_grams * batch.price_per_gram) * 100) / 100;
      const journalId = valueDelta !== 0 ? await postJournal(client, { transactionType: "STOCK_ADJUSTMENT", referenceType: "stock_batch", referenceId: batchId,
        description: `Stock value adjustment batch #${batchId}`, createdBy: actor.id,
        lines: valueDelta > 0 ? [{ accountCode: "1200", debit: valueDelta }, { accountCode: "3000", credit: valueDelta }]
          : [{ accountCode: "3000", debit: -valueDelta }, { accountCode: "1200", credit: -valueDelta }] }) : null;
      await client.query("UPDATE stock_batches SET grams=$1,price_per_gram=$2,remaining_grams=$1-$3,status=CASE WHEN $1-$3>0 THEN 'OPEN' ELSE 'CLOSED' END,updated_at=now() WHERE id=$4", [grams, price, sold, batchId]);
      await writeAuditLog(client, { userId: actor.id, action: "stock.update", entityType: "stock_batch", entityId: batchId,
        metadata: { previous: { grams: batch.grams, price: batch.price_per_gram }, current: { grams, price } } });
      if (journalId) await writeAuditLog(client, { userId: actor.id, action: "accounting.post", entityType: "stock_batch", entityId: batchId, metadata: { journalId } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Stock update failed" }; }
}
