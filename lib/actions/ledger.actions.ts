"use server";

import { getDb } from "../db";

export async function getCustomerLedger(customerId: number) {
    try {
        const db = getDb();

        const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(customerId) as any;
        if (!customer) {
            return { error: "Customer not found" };
        }

        const sales = db.prepare(`
            SELECT 
                s.id, 
                s.grams_sold as grams, 
                s.final_amount, 
                s.amount_received, 
                s.created_at, 
                'sale' as type,
                GROUP_CONCAT(sba.batch_id, ', ') as batch_numbers
            FROM sales s
            LEFT JOIN sale_batch_assignments sba ON s.id = sba.sale_id
            WHERE s.customer_id = ?
            GROUP BY s.id
        `).all(customerId) as any[];
        const payments = db.prepare("SELECT id, amount as amount_received, created_at, 'payment' as type FROM payments WHERE customer_id = ?").all(customerId) as any[];

        // Merge and sort by created_at ascending
        const timeline = [...sales, ...payments].sort((a, b) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        // Calculate running balance and totals
        let runningBalance = customer.old_loan || 0;
        let totalGrams = 0;
        let totalPayments = 0;

        const processedTimeline = timeline.map(item => {
            if (item.type === 'sale') {
                totalGrams += item.grams || 0;
                totalPayments += item.amount_received || 0;
                // Add the sale's final amount to loan, subtract what they paid at that time
                runningBalance += (item.final_amount || 0) - (item.amount_received || 0);
                return {
                    ...item,
                    running_balance: runningBalance
                };
            } else {
                totalPayments += item.amount_received || 0;
                // Subtract payment from loan
                runningBalance -= (item.amount_received || 0);
                return {
                    ...item,
                    running_balance: runningBalance
                };
            }
        });

        return {
            success: true,
            customer,
            timeline: processedTimeline,
            summary: {
                totalGrams,
                totalPayments,
                finalBalance: (customer.total_loan || 0) + (customer.old_loan || 0) // Use combined debt as source of truth
            }
        };

    } catch (err) {
        return { error: (err as Error).message };
    }
}
