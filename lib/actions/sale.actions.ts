"use server";

import { getDb } from "../db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth.actions";

export async function getAllSales() {
    const db = getDb();
    const sales = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `).all() as any[];

    const assignments = db.prepare(`
      SELECT sale_id, batch_id, grams_deducted 
      FROM sale_batch_assignments
    `).all() as any[];

    for (const sale of sales) {
        sale.batchesDeducted = assignments.filter(a => a.sale_id === sale.id);
    }
    return sales;
}

export async function createSale(formData: FormData) {
    const customerId = parseInt(formData.get("customer_id") as string);
    const gramsSold = parseFloat(formData.get("grams_sold") as string);
    const discount = parseFloat(formData.get("discount") as string) || 0;
    const amountReceived = parseFloat(formData.get("amount_received") as string) || 0;
    const optionalBatchId = formData.get("batch_id") ? parseInt(formData.get("batch_id") as string) : null;
    let comments = formData.get("comments") as string || null;

    if (!customerId || isNaN(gramsSold) || gramsSold <= 0) {
        return { error: "Invalid sale parameters" };
    }

    try {
        const db = getDb();
        const user = await getSessionUser();
        let adminName = user?.name || "A";

        // Inject the Hidden Admin Tag into the Comments Payload
        const adminTag = `||ADMIN||${adminName}||`;
        if (comments) {
            comments = comments + " " + adminTag;
        } else {
            comments = adminTag;
        }

        // Evaluate Tiered Pricing Structure
        let grossAmount = 0;
        if (gramsSold >= 0.25 && gramsSold <= 0.30) {
            grossAmount = 250;
        } else if (gramsSold >= 0.50 && gramsSold <= 0.60) {
            grossAmount = 500;
        } else {
            const ratePerGram = 1000;
            grossAmount = gramsSold * ratePerGram;
        }

        const finalAmount = grossAmount - discount;
        const balance = finalAmount - amountReceived;

        if (balance < 0) {
            return { error: "Received amount cannot exceed final amount" };
        }

        // Begin robust transaction
        const result = db.transaction(() => {
            // 1. Check total stock
            const stockRes = db.prepare("SELECT SUM(remaining_grams) as total FROM stock_batches").get() as { total: number | null };
            const totalStock = stockRes.total || 0;
            if (totalStock < gramsSold) {
                throw new Error(`Insufficient stock. Only ${totalStock.toFixed(2)}g available.`);
            }

            // 2. FIFO Deduction Logic OR Manual Override
            let batches = [];
            if (optionalBatchId) {
                const specificBatch = db.prepare("SELECT * FROM stock_batches WHERE id = ?").get(optionalBatchId) as any;
                if (!specificBatch || specificBatch.remaining_grams < gramsSold) {
                    throw new Error(`Insufficient stock in selected Batch #${optionalBatchId}. Has ${specificBatch?.remaining_grams || 0}g available, needs ${gramsSold}g.`);
                }
                batches = [specificBatch];
            } else {
                batches = db.prepare("SELECT * FROM stock_batches WHERE remaining_grams > 0 ORDER BY created_at ASC").all() as any[];
            }

            let remainingToDeduct = gramsSold;
            const batchDeductions = [];

            for (const batch of batches) {
                if (remainingToDeduct <= 0) break;

                const deductGrams = Math.min(batch.remaining_grams, remainingToDeduct);
                remainingToDeduct -= deductGrams;

                db.prepare("UPDATE stock_batches SET remaining_grams = remaining_grams - ? WHERE id = ?").run(deductGrams, batch.id);

                batchDeductions.push({ batchId: batch.id, deducted: deductGrams });
            }

            if (remainingToDeduct > 0.001) { // Floating point safety margin
                throw new Error("Critical Error: Stock mismatch during FIFO deduction. Database integrity prevents this sale.");
            }

            // 3. Create Sale Record
            const saleInsert = db.prepare(`
        INSERT INTO sales (customer_id, grams_sold, gross_amount, discount, final_amount, amount_received, balance, comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const { lastInsertRowid: saleId } = saleInsert.run(
                customerId, gramsSold, grossAmount, discount, finalAmount, amountReceived, balance, comments
            );

            // 4. Record the Specific Batch Assignments
            const assignmentInsert = db.prepare("INSERT INTO sale_batch_assignments (sale_id, batch_id, grams_deducted) VALUES (?, ?, ?)");
            for (const { batchId, deducted } of batchDeductions) {
                assignmentInsert.run(saleId, batchId, deducted);
            }

            // 5. Update Customer Loan
            if (balance > 0) {
                db.prepare("UPDATE customers SET total_loan = total_loan + ? WHERE id = ?").run(balance, customerId);
            }

            return saleId;
        })();

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/customers");
        revalidatePath("/add-sale");

        return { success: true, saleId: result };
    } catch (err) {
        return { error: (err as Error).message };
    }
}

export async function deleteSale(saleId: number) {
    try {
        const db = getDb();
        const result = db.transaction(() => {
            // 1. Fetch exact attributes of the sale to rollback
            const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId) as any;
            if (!sale) throw new Error("Sale record not found");

            // 2. Fetch the exact batch deductions to restore
            const assignments = db.prepare("SELECT * FROM sale_batch_assignments WHERE sale_id = ?").all(saleId) as any[];

            // 3. Restore each exact deducted fraction back to the respective stock batch
            for (const assign of assignments) {
                db.prepare("UPDATE stock_batches SET remaining_grams = remaining_grams + ? WHERE id = ?").run(assign.grams_deducted, assign.batch_id);
            }

            // 4. Reverse the customer's loan differential 
            if (sale.balance > 0) {
                db.prepare("UPDATE customers SET total_loan = total_loan - ? WHERE id = ?").run(sale.balance, sale.customer_id);
            }

            // 5. Erase linking junction assignments and then the physical sale metadata
            db.prepare("DELETE FROM sale_batch_assignments WHERE sale_id = ?").run(saleId);
            db.prepare("DELETE FROM sales WHERE id = ?").run(saleId);

            return true;
        })();

        if (result) {
            revalidatePath("/");
            revalidatePath("/stock");
            revalidatePath("/customers");
            return { success: true };
        }
    } catch (e: any) {
        console.error("Delete Sale rollback failed:", e.message);
        return { error: e.message };
    }
    return { error: "Unknown error deleting sale" };
}

export async function updateSale(saleId: number, formData: FormData) {
    const rawGramsSold = formData.get("grams_sold") as string | null;
    let newGramsSold = rawGramsSold ? parseFloat(rawGramsSold) : null;
    const rawDiscount = formData.get("discount") as string | null;
    const newDiscount = rawDiscount !== null ? parseFloat(rawDiscount) : null;
    const rawAmountReceived = formData.get("amount_received") as string | null;
    const newAmountReceived = rawAmountReceived !== null ? parseFloat(rawAmountReceived) : null;

    try {
        const db = getDb();

        const result = db.transaction(() => {
            // Retrieve Original Sale State
            const origSale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId) as any;
            if (!origSale) throw new Error("Sale not found.");

            // Did the actual physical product amount change?
            if (newGramsSold !== null && newGramsSold !== origSale.grams_sold) {
                // Changing the physical grams disrupts the original FIFO math entirely.
                // Action: Rollback this sale natively, then re-create it immediately with the new param load.

                // Copy all missing properties from Original if not provided via FormData patching
                const passForm = new FormData();
                passForm.append("customer_id", origSale.customer_id.toString());
                passForm.append("grams_sold", newGramsSold.toString());
                passForm.append("discount", (newDiscount !== null ? newDiscount : origSale.discount).toString());
                passForm.append("amount_received", (newAmountReceived !== null ? newAmountReceived : origSale.amount_received).toString());

                // Rollback manual call logic:
                const assignments = db.prepare("SELECT * FROM sale_batch_assignments WHERE sale_id = ?").all(saleId) as any[];
                for (const assign of assignments) {
                    db.prepare("UPDATE stock_batches SET remaining_grams = remaining_grams + ? WHERE id = ?").run(assign.grams_deducted, assign.batch_id);
                }
                if (origSale.balance > 0) {
                    db.prepare("UPDATE customers SET total_loan = total_loan - ? WHERE id = ?").run(origSale.balance, origSale.customer_id);
                }
                db.prepare("DELETE FROM sale_batch_assignments WHERE sale_id = ?").run(saleId);
                db.prepare("DELETE FROM sales WHERE id = ?").run(saleId);

                // Run original `createSale` inside this transaction block! It throws exact Errors natively back up.
                // NOTE: We cannot call createSale(passForm) server action strictly inside transaction safely.
                throw new Error("Changing physical gram amount currently requires deleting the sale and generating a new one to preserve strict FIFO tracking architecture.");
            }

            // Only adjusting Financials (Discount, Amount Received). FIFO untouched. No physical changes.
            const targetDiscount = newDiscount !== null ? newDiscount : origSale.discount;
            const targetReceived = newAmountReceived !== null ? newAmountReceived : origSale.amount_received;

            let targetGross = 0;
            if (origSale.grams_sold >= 0.25 && origSale.grams_sold <= 0.30) {
                targetGross = 250;
            } else if (origSale.grams_sold >= 0.50 && origSale.grams_sold <= 0.60) {
                targetGross = 500;
            } else {
                const ratePerGram = 1000;
                targetGross = origSale.grams_sold * ratePerGram;
            }

            const targetFinal = targetGross - targetDiscount;
            const targetBalance = targetFinal - targetReceived;

            if (targetBalance < 0) throw new Error("Amount Received cannot exceed the final evaluated amount after discounts.");

            // Patch difference mathematically back into loan accounts
            const originalLoanAmount = origSale.balance > 0 ? origSale.balance : 0;
            const newLoanAmount = targetBalance > 0 ? targetBalance : 0;
            const loanDifferential = newLoanAmount - originalLoanAmount; // e.g., 500 (new) - 100 (old) = +400 to loan account. 

            if (loanDifferential !== 0) {
                db.prepare("UPDATE customers SET total_loan = total_loan + ? WHERE id = ?").run(loanDifferential, origSale.customer_id);
            }

            // Finally, overwrite the sale stats itself
            db.prepare(`
                UPDATE sales 
                SET discount = ?, final_amount = ?, amount_received = ?, balance = ? 
                WHERE id = ?
            `).run(targetDiscount, targetFinal, targetReceived, targetBalance, saleId);

            return true;
        })();

        if (result) {
            revalidatePath("/");
            revalidatePath("/customers");
            return { success: true };
        }
    } catch (e: any) {
        console.error("Sale update failed:", e.message);
        return { error: e.message };
    }
    return { error: "Unknown error patching sale." };
}
