"use server";

import { query, withTransaction } from "../db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/authorization";
import { postJournal, reverseJournals, JournalLineInput } from "../accounting";
import { writeAuditLog } from "../audit";
import { allocateFifo } from "../inventory";
import { Sale, SaleBatchAssignment, ActionResult, Settings } from "@/types";

function refreshSaleViews() { for (const path of ["/", "/stock", "/customers", "/transactions", "/add-sale", "/accounting", "/audit"]) revalidatePath(path); }

export async function getAllSales(): Promise<Sale[]> {
  await requirePermission("sales.read");
  const sales = await query<Sale>(`SELECT s.*,c.name AS customer_name FROM sales s JOIN customers c ON c.id=s.customer_id ORDER BY s.created_at DESC`);
  const assignments = await query<SaleBatchAssignment>(`SELECT sale_id,batch_id,grams_deducted,unit_cost FROM sale_batch_assignments ORDER BY id`);
  return sales.rows.map((sale) => ({ ...sale, batchesDeducted: assignments.rows.filter((item) => item.sale_id === sale.id) }));
}

export async function createSale(formData: FormData): Promise<ActionResult> {
  const customerId = Number(formData.get("customer_id"));
  const gramsSold = Number(formData.get("grams_sold"));
  const discount = Number(formData.get("discount") || 0);
  const amountReceived = Number(formData.get("amount_received") || 0);
  const requestedBatchId = formData.get("batch_id") ? Number(formData.get("batch_id")) : null;
  if (!Number.isInteger(customerId) || !Number.isFinite(gramsSold) || gramsSold <= 0 || discount < 0 || amountReceived < 0) return { error: "Invalid sale parameters" };
  try {
    const actor = await requirePermission("sales.create");
    const saleId = await withTransaction(async (client) => {
      const customer = await client.query("SELECT id FROM customers WHERE id=$1 FOR UPDATE", [customerId]);
      if (!customer.rows[0]) throw new Error("Customer not found.");
      const settingsResult = await client.query<Settings>("SELECT * FROM settings WHERE id=1");
      const settings = settingsResult.rows[0] ?? { rate_per_gram: 1000, special_025_030: 250, special_050_060: 500 };
      let grossAmount = Number(formData.get("gross_amount"));
      if (!Number.isFinite(grossAmount)) grossAmount = gramsSold >= 0.25 && gramsSold <= 0.30 ? settings.special_025_030 : gramsSold >= 0.5 && gramsSold <= 0.6 ? settings.special_050_060 : gramsSold * settings.rate_per_gram;
      grossAmount = Math.round(grossAmount * 100) / 100;
      const finalAmount = Math.round(Math.max(0, grossAmount - discount) * 100) / 100;
      if (discount > grossAmount || amountReceived > finalAmount) throw new Error("Discount or received amount exceeds the sale amount.");
      const balance = Math.round((finalAmount - amountReceived) * 100) / 100;

      const allocations = await allocateFifo(client, gramsSold, requestedBatchId);

      const rawComments = String(formData.get("comments") || "").trim();
      const tag = `||ADMIN||${actor.name || "A"}||`;
      const sale = await client.query<{ id: number }>(
        `INSERT INTO sales(customer_id,grams_sold,gross_amount,discount,final_amount,amount_received,balance,comments,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [customerId, gramsSold, grossAmount, discount, finalAmount, amountReceived, balance, rawComments ? `${rawComments} ${tag}` : tag, actor.id]);
      const id = sale.rows[0].id;
      for (const item of allocations) await client.query(`INSERT INTO sale_batch_assignments(sale_id,batch_id,grams_deducted,unit_cost) VALUES($1,$2,$3,$4)`, [id, item.batchId, item.grams, item.unitCost]);
      if (balance > 0) await client.query("UPDATE customers SET total_loan=total_loan+$1,updated_at=now() WHERE id=$2", [balance, customerId]);

      const journalIds: number[] = [];
      if (finalAmount > 0) {
        const lines: JournalLineInput[] = [];
        if (amountReceived > 0) lines.push({ accountCode: "1000", debit: amountReceived, description: "Cash received" });
        if (balance > 0) lines.push({ accountCode: "1100", debit: balance, description: "Customer receivable" });
        lines.push({ accountCode: "4000", credit: finalAmount, description: "Sales revenue" });
        journalIds.push(await postJournal(client, { transactionType: "SALE_REVENUE", referenceType: "sale", referenceId: id, description: `Sale #${id}`, createdBy: actor.id, lines }));
      }
      const cost = Math.round(allocations.reduce((sum, item) => sum + item.grams * item.unitCost, 0) * 100) / 100;
      if (cost > 0) journalIds.push(await postJournal(client, { transactionType: "SALE_COGS", referenceType: "sale", referenceId: id, description: `Inventory cost for sale #${id}`, createdBy: actor.id,
        lines: [{ accountCode: "5000", debit: cost, description: "Cost of goods sold" }, { accountCode: "1200", credit: cost, description: "Inventory consumed" }] }));
      await writeAuditLog(client, { userId: actor.id, action: "sale.create", entityType: "sale", entityId: id, metadata: { customerId, gramsSold, finalAmount, allocationCount: allocations.length } });
      await writeAuditLog(client, { userId: actor.id, action: "accounting.post", entityType: "sale", entityId: id, metadata: { journalIds } });
      return id;
    }, "SERIALIZABLE");
    refreshSaleViews();
    return { success: true, saleId };
  } catch (error) { console.error("Sale creation failed:", error); return { error: error instanceof Error ? error.message : "Sale failed" }; }
}

export async function deleteSale(saleId: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("sales.reverse");
    await withTransaction(async (client) => {
      const sale = (await client.query<Sale>("SELECT * FROM sales WHERE id=$1 FOR UPDATE", [saleId])).rows[0];
      if (!sale) throw new Error("Sale record not found");
      if (sale.status === "REVERSED") throw new Error("Sale has already been reversed.");
      const assignments = await client.query<SaleBatchAssignment>("SELECT * FROM sale_batch_assignments WHERE sale_id=$1 ORDER BY id FOR UPDATE", [saleId]);
      for (const item of assignments.rows) await client.query("UPDATE stock_batches SET remaining_grams=remaining_grams+$1,status='OPEN',updated_at=now() WHERE id=$2", [item.grams_deducted, item.batch_id]);
      if (sale.balance > 0) await client.query("UPDATE customers SET total_loan=GREATEST(0,total_loan-$1),updated_at=now() WHERE id=$2", [sale.balance, sale.customer_id]);
      const reversalJournalIds = await reverseJournals(client, "sale", saleId, actor.id, `Reversal of sale #${saleId}`);
      await client.query("UPDATE sales SET status='REVERSED',reversed_at=now(),reversed_by=$2 WHERE id=$1", [saleId, actor.id]);
      await writeAuditLog(client, { userId: actor.id, action: "sale.reverse", entityType: "sale", entityId: saleId, metadata: { reversalJournalIds } });
      await writeAuditLog(client, { userId: actor.id, action: "accounting.reverse", entityType: "sale", entityId: saleId, metadata: { reversalJournalIds } });
    });
    refreshSaleViews();
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Sale reversal failed" }; }
}

export async function updateSale(saleId: number, formData: FormData): Promise<ActionResult> {
  const newGrams = formData.get("grams_sold") ? Number(formData.get("grams_sold")) : null;
  try {
    const actor = await requirePermission("sales.create");
    await withTransaction(async (client) => {
      const sale = (await client.query<Sale>("SELECT * FROM sales WHERE id=$1 FOR UPDATE", [saleId])).rows[0];
      if (!sale || sale.status === "REVERSED") throw new Error("Active sale not found.");
      if (newGrams !== null && newGrams !== sale.grams_sold) throw new Error("Changing grams requires reversing the sale and creating a new one so FIFO history remains exact.");
      const discount = formData.get("discount") !== null ? Number(formData.get("discount")) : sale.discount;
      const received = formData.get("amount_received") !== null ? Number(formData.get("amount_received")) : sale.amount_received;
      const finalAmount = Math.round((sale.gross_amount - discount) * 100) / 100;
      if (discount < 0 || finalAmount < 0 || received < 0 || received > finalAmount) throw new Error("Invalid discount or amount received.");
      const balance = Math.round((finalAmount - received) * 100) / 100;
      const lines: JournalLineInput[] = [];
      const addDelta = (accountCode: string, delta: number, natural: "debit" | "credit") => {
        const value = Math.round(Math.abs(delta) * 100) / 100;
        if (value) lines.push({ accountCode, [delta > 0 ? natural : natural === "debit" ? "credit" : "debit"]: value });
      };
      addDelta("1000", received - sale.amount_received, "debit"); addDelta("1100", balance - sale.balance, "debit"); addDelta("4000", finalAmount - sale.final_amount, "credit");
      if (lines.length) await postJournal(client, { transactionType: "SALE_ADJUSTMENT", referenceType: "sale", referenceId: saleId, description: `Financial adjustment for sale #${saleId}`, createdBy: actor.id, lines });
      await client.query("UPDATE customers SET total_loan=GREATEST(0,total_loan+$1),updated_at=now() WHERE id=$2", [balance - sale.balance, sale.customer_id]);
      await client.query("UPDATE sales SET discount=$1,final_amount=$2,amount_received=$3,balance=$4 WHERE id=$5", [discount, finalAmount, received, balance, saleId]);
      await writeAuditLog(client, { userId: actor.id, action: "sale.update", entityType: "sale", entityId: saleId, metadata: { previous: { discount: sale.discount, received: sale.amount_received }, current: { discount, received } } });
    });
    refreshSaleViews();
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Sale update failed" }; }
}
