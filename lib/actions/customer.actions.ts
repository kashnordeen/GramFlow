"use server";

import { query, withTransaction } from "../db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/authorization";
import { postJournal } from "../accounting";
import { writeAuditLog } from "../audit";
import { Customer, ActionResult } from "@/types";

const refresh = () => { revalidatePath("/"); revalidatePath("/customers"); revalidatePath("/add-sale"); revalidatePath("/accounting"); revalidatePath("/audit"); };

export async function getCustomers(): Promise<Customer[]> {
  await requirePermission("customers.read");
  return (await query<Customer>("SELECT * FROM customers ORDER BY name,id")).rows;
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const oldLoan = Number(formData.get("old_loan") || 0);
  if (!name || !Number.isFinite(oldLoan) || oldLoan < 0) return { error: "A valid name and opening loan are required." };
  try {
    const actor = await requirePermission("customers.create");
    await withTransaction(async (client) => {
      const customer = await client.query<{ id: number }>("INSERT INTO customers(name,phone,old_loan) VALUES($1,$2,$3) RETURNING id", [name, phone, oldLoan]);
      if (oldLoan > 0) await postJournal(client, { transactionType: "OPENING_RECEIVABLE", referenceType: "customer", referenceId: customer.rows[0].id,
        description: `Opening receivable for ${name}`, createdBy: actor.id,
        lines: [{ accountCode: "1100", debit: oldLoan }, { accountCode: "3000", credit: oldLoan }] });
      await writeAuditLog(client, { userId: actor.id, action: "customer.create", entityType: "customer", entityId: customer.rows[0].id, metadata: { name, phone, oldLoan } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Customer creation failed" }; }
}

export async function addCustomerPayment(customerId: number, amount: number): Promise<ActionResult> {
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Invalid payment amount" };
  try {
    const actor = await requirePermission("payments.create");
    await withTransaction(async (client) => {
      const customer = (await client.query<Customer>("SELECT * FROM customers WHERE id=$1 FOR UPDATE", [customerId])).rows[0];
      if (!customer) throw new Error("Customer not found.");
      const outstanding = customer.old_loan + customer.total_loan;
      if (amount > outstanding) throw new Error(`Payment cannot exceed the outstanding balance of ₹${outstanding.toFixed(2)}.`);
      const appliedOld = Math.min(amount, customer.old_loan);
      const appliedCurrent = amount - appliedOld;
      await client.query("UPDATE customers SET old_loan=old_loan-$1,total_loan=total_loan-$2,updated_at=now() WHERE id=$3", [appliedOld, appliedCurrent, customerId]);
      const payment = await client.query<{ id: number }>("INSERT INTO payments(customer_id,amount,created_by) VALUES($1,$2,$3) RETURNING id", [customerId, amount, actor.id]);
      const journalId = await postJournal(client, { transactionType: "CUSTOMER_PAYMENT", referenceType: "payment", referenceId: payment.rows[0].id,
        description: `Payment from customer #${customerId}`, createdBy: actor.id,
        lines: [{ accountCode: "1000", debit: amount, description: "Cash received" }, { accountCode: "1100", credit: amount, description: "Receivable settled" }] });
      await writeAuditLog(client, { userId: actor.id, action: "payment.create", entityType: "payment", entityId: payment.rows[0].id, metadata: { customerId, amount, journalId } });
      await writeAuditLog(client, { userId: actor.id, action: "accounting.post", entityType: "payment", entityId: payment.rows[0].id, metadata: { journalId } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Payment failed" }; }
}

export async function deleteCustomer(customerId: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("customers.delete");
    await withTransaction(async (client) => {
      const history = await client.query<{ count: number }>(`SELECT (SELECT count(*) FROM sales WHERE customer_id=$1)+(SELECT count(*) FROM payments WHERE customer_id=$1) AS count`, [customerId]);
      if (Number(history.rows[0]?.count) > 0) throw new Error("Customers with transaction history cannot be deleted. Preserve the accounting and audit trail.");
      const deleted = await client.query("DELETE FROM customers WHERE id=$1 RETURNING id,name", [customerId]);
      if (!deleted.rows[0]) throw new Error("Customer not found.");
      await writeAuditLog(client, { userId: actor.id, action: "customer.delete", entityType: "customer", entityId: customerId, metadata: { name: deleted.rows[0].name } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Customer deletion failed" }; }
}

export async function updateCustomerLoan(customerId: number, newOldLoan: number, newTotalLoan: number): Promise<ActionResult> {
  if (![newOldLoan, newTotalLoan].every((value) => Number.isFinite(value) && value >= 0)) return { error: "Invalid loan structure." };
  try {
    const actor = await requirePermission("customers.update");
    await withTransaction(async (client) => {
      const customer = (await client.query<Customer>("SELECT * FROM customers WHERE id=$1 FOR UPDATE", [customerId])).rows[0];
      if (!customer) throw new Error("Customer not found.");
      const delta = Math.round(((newOldLoan + newTotalLoan) - (customer.old_loan + customer.total_loan)) * 100) / 100;
      if (delta !== 0) await postJournal(client, { transactionType: "RECEIVABLE_ADJUSTMENT", referenceType: "customer", referenceId: customerId,
        description: `Receivable adjustment for customer #${customerId}`, createdBy: actor.id,
        lines: delta > 0 ? [{ accountCode: "1100", debit: delta }, { accountCode: "3000", credit: delta }]
          : [{ accountCode: "3000", debit: -delta }, { accountCode: "1100", credit: -delta }] });
      await client.query("UPDATE customers SET old_loan=$1,total_loan=$2,updated_at=now() WHERE id=$3", [newOldLoan, newTotalLoan, customerId]);
      await writeAuditLog(client, { userId: actor.id, action: "customer.update", entityType: "customer", entityId: customerId,
        metadata: { previous: { oldLoan: customer.old_loan, totalLoan: customer.total_loan }, current: { oldLoan: newOldLoan, totalLoan: newTotalLoan } } });
    });
    refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Customer update failed" }; }
}
