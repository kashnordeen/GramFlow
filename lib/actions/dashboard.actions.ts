"use server";

import { query } from "../db";
import { requireAuthenticatedUser } from "../auth/authorization";
import { DashboardMetrics, Sale, Customer } from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics | { error: string }> {
  try {
    await requireAuthenticatedUser();
    const [stock, today, loans, revenue, recent, debtors] = await Promise.all([
      query<{ total: number }>("SELECT COALESCE(sum(remaining_grams),0) AS total FROM stock_batches WHERE status='OPEN'"),
      query<{ count: number; grams: number; amount: number }>(`SELECT count(*)::int AS count,COALESCE(sum(grams_sold),0) AS grams,COALESCE(sum(final_amount),0) AS amount FROM sales WHERE status='POSTED' AND created_at>=CURRENT_DATE`),
      query<{ total: number }>("SELECT COALESCE(sum(total_loan+old_loan),0) AS total FROM customers"),
      query<{ total: number }>("SELECT COALESCE(sum(final_amount),0) AS total FROM sales WHERE status='POSTED'"),
      query<Sale>(`SELECT s.*,c.name AS customer_name FROM sales s JOIN customers c ON c.id=s.customer_id WHERE s.status='POSTED' ORDER BY s.created_at DESC LIMIT 6`),
      query<Customer>(`SELECT * FROM customers WHERE total_loan+old_loan>0 ORDER BY total_loan+old_loan DESC`),
    ]);
    return { totalStock: stock.rows[0].total, salesToday: today.rows[0], totalLoan: loans.rows[0].total,
      totalProfit: revenue.rows[0].total, recentSales: recent.rows, customersWithLoans: debtors.rows };
  } catch { return { error: "Could not fetch dashboard metrics." }; }
}
