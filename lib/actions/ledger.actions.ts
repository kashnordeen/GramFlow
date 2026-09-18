"use server";

import { query } from "../db";
import { requirePermission } from "../auth/authorization";
import { Customer, CustomerLedgerData, TimelineItem, ActionResult } from "@/types";

interface SaleItem { id: number; grams: number; final_amount: number; amount_received: number; created_at: string; type: "sale"; batch_numbers: string | null; }
interface PaymentItem { id: number; amount_received: number; created_at: string; type: "payment"; }

export async function getCustomerLedger(customerId: number): Promise<ActionResult<CustomerLedgerData>> {
  try {
    await requirePermission("customers.read");
    const customer = (await query<Customer>("SELECT * FROM customers WHERE id=$1", [customerId])).rows[0];
    if (!customer) return { error: "Customer not found" };
    const [sales, payments] = await Promise.all([
      query<SaleItem>(`SELECT s.id,s.grams_sold AS grams,s.final_amount,s.amount_received,s.created_at,'sale'::text AS type,
        string_agg(a.batch_id::text,', ' ORDER BY a.batch_id) AS batch_numbers
        FROM sales s LEFT JOIN sale_batch_assignments a ON a.sale_id=s.id WHERE s.customer_id=$1 AND s.status='POSTED'
        GROUP BY s.id ORDER BY s.created_at`, [customerId]),
      query<PaymentItem>(`SELECT id,amount AS amount_received,created_at,'payment'::text AS type FROM payments WHERE customer_id=$1 ORDER BY created_at`, [customerId]),
    ]);
    const timeline = [...sales.rows, ...payments.rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let runningBalance = customer.old_loan || 0, totalGrams = 0, totalPayments = 0;
    const processed: TimelineItem[] = timeline.map((item) => {
      if (item.type === "sale") {
        totalGrams += item.grams; totalPayments += item.amount_received; runningBalance += item.final_amount - item.amount_received;
        return { ...item, running_balance: runningBalance, batch_numbers: item.batch_numbers || undefined };
      }
      totalPayments += item.amount_received; runningBalance -= item.amount_received;
      return { ...item, running_balance: runningBalance };
    });
    return { success: true, data: { customer, timeline: processed, summary: { totalGrams, totalPayments, finalBalance: customer.total_loan + customer.old_loan } } };
  } catch (error) { return { error: error instanceof Error ? error.message : "Ledger lookup failed" }; }
}
