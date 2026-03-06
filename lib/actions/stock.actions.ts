"use server";

import { getDb } from "../db";
import { revalidatePath } from "next/cache";

export async function getStockBatches() {
    const db = getDb();
    // Calculate precise revenue proportion from multi-batch FIFO sales
    return db.prepare(`
        SELECT 
            sb.*,
            (sb.grams * sb.price_per_gram) as total_cost,
            COALESCE(SUM(
                sba.grams_deducted * (s.final_amount / s.grams_sold)
            ), 0) as total_revenue
        FROM stock_batches sb
        LEFT JOIN sale_batch_assignments sba ON sb.id = sba.batch_id
        LEFT JOIN sales s ON sba.sale_id = s.id
        GROUP BY sb.id
        ORDER BY sb.created_at DESC
    `).all();
}

export async function getTotalStock() {
    try {
        const db = getDb();
        const res = db.prepare("SELECT SUM(remaining_grams) as total FROM stock_batches").get() as { total: number | null };
        return res.total || 0;
    } catch (e) {
        return 0; // Return zero if DB not properly instantiated yet
    }
}

export async function addStockBatch(formData: FormData) {
    const grams = parseFloat(formData.get("grams") as string);
    const costPrice = parseFloat(process.env.COST_PRICE_PER_GRAM || "0");

    if (isNaN(grams) || grams <= 0) return { error: "Invalid grams amount" };
    if (isNaN(costPrice) || costPrice <= 0) return { error: "COST_PRICE_PER_GRAM environment variable is not set correctly." };

    try {
        const db = getDb();
        db.prepare("INSERT INTO stock_batches (grams, price_per_gram, remaining_grams) VALUES (?, ?, ?)").run(grams, costPrice, grams);

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/add-sale"); // Need to ensure the UI updates the stock limits
        return { success: true };
    } catch (err) {
        return { error: (err as Error).message };
    }
}

export async function deleteStockBatch(batchId: number) {
    try {
        const db = getDb();

        // Ensure this batch hasn't already been depleted by sales.
        const batch = db.prepare("SELECT * FROM stock_batches WHERE id = ?").get(batchId) as any;

        if (!batch) throw new Error("Batch not found.");

        if (batch.grams !== batch.remaining_grams) {
            throw new Error(`Cannot delete this batch. ${batch.grams - batch.remaining_grams}g has already been sold. You must delete the associated Sales first.`);
        }

        db.prepare("DELETE FROM stock_batches WHERE id = ?").run(batchId);

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/add-sale");

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function closeStockBatch(batchId: number) {
    try {
        const db = getDb();
        const batch = db.prepare("SELECT * FROM stock_batches WHERE id = ?").get(batchId) as any;
        if (!batch) throw new Error("Batch not found.");

        // Force the remaining grams to 0 to end the batch lifecycle
        db.prepare("UPDATE stock_batches SET remaining_grams = 0 WHERE id = ?").run(batchId);

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/add-sale");

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateStockBatch(batchId: number, formData: FormData) {
    const rawGrams = formData.get("grams") as string | null;
    const rawPrice = formData.get("price_per_gram") as string | null;

    try {
        const db = getDb();
        const batch = db.prepare("SELECT * FROM stock_batches WHERE id = ?").get(batchId) as any;
        if (!batch) throw new Error("Batch not found.");

        let newGrams = rawGrams !== null ? parseFloat(rawGrams) : batch.grams;
        let newPrice = rawPrice !== null ? parseFloat(rawPrice) : batch.price_per_gram;

        // Safety check to ensure we aren't shrinking the batch smaller than what has already been sold from it!
        const soldAmount = batch.grams - batch.remaining_grams;

        if (newGrams < soldAmount) {
            throw new Error(`Cannot reduce batch size below ${soldAmount}g because that amount has already been sold from this specific batch!`);
        }

        const newRemaining = newGrams - soldAmount;

        db.prepare("UPDATE stock_batches SET grams = ?, price_per_gram = ?, remaining_grams = ? WHERE id = ?").run(newGrams, newPrice, newRemaining, batchId);

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/add-sale");

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
