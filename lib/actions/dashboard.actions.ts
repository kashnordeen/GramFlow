"use server";

import { getDb } from "../db";

export async function getDashboardMetrics() {
    try {
        const db = getDb();

        // Total Stock Remaining
        const stockRes = db.prepare("SELECT SUM(remaining_grams) as total FROM stock_batches").get() as { total: number | null };
        const totalStock = stockRes.total || 0;

        // Sales Today
        const salesTodayRes = db.prepare(`
      SELECT COUNT(*) as count, SUM(grams_sold) as grams, SUM(final_amount) as amount 
      FROM sales 
      WHERE date(created_at) = date('now')
    `).get() as { count: number, grams: number | null, amount: number | null };

        // Total Loan Pending
        const loanRes = db.prepare("SELECT SUM(total_loan + old_loan) as total FROM customers").get() as { total: number | null };

        // Total Profit (100% of Sales gross as requested)
        const profitRes = db.prepare("SELECT SUM(final_amount) as total_final FROM sales").get() as { total_final: number | null };
        const totalProfit = profitRes.total_final || 0;

        // Recent Transactions
        const recentSales = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 6
    `).all();

        // Customers with active loans for Modal Display
        const customersWithLoans = db.prepare(`
      SELECT id, name, total_loan, old_loan, phone
      FROM customers
      WHERE (total_loan + old_loan) > 0
      ORDER BY (total_loan + old_loan) DESC
    `).all();

        return {
            totalStock,
            salesToday: {
                count: salesTodayRes.count,
                grams: salesTodayRes.grams || 0,
                amount: salesTodayRes.amount || 0
            },
            totalLoan: loanRes.total || 0,
            totalProfit,
            recentSales: recentSales as any[],
            customersWithLoans: customersWithLoans as any[]
        };
    } catch (err) {
        return {
            error: "Could not initialize DB or fetch metrics. Please make sure tables exist."
        };
    }
}
