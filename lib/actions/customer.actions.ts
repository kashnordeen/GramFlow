"use server";

import { getDb } from "../db";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
    const db = getDb();
    return db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
}

export async function createCustomer(formData: FormData) {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const rawOldLoan = formData.get("old_loan") as string;
    const old_loan = rawOldLoan && !isNaN(parseFloat(rawOldLoan)) ? parseFloat(rawOldLoan) : 0;

    if (!name) return { error: "Name is required" };

    try {
        const db = getDb();
        db.prepare("INSERT INTO customers (name, phone, old_loan) VALUES (?, ?, ?)").run(name, phone || null, old_loan);

        revalidatePath("/customers");
        revalidatePath("/add-sale"); // Sale dropdown might need customer format
        return { success: true };
    } catch (err) {
        return { error: (err as Error).message };
    }
}

export async function addCustomerPayment(customerId: number, amount: number) {
    if (amount <= 0) return { error: "Invalid payment amount" };

    try {
        const db = getDb();

        const transaction = db.transaction(() => {
            const customer = db.prepare("SELECT old_loan, total_loan FROM customers WHERE id = ?").get(customerId) as any;
            if (!customer) throw new Error("Customer not found.");

            let remainingPayment = amount;
            let newOldLoan = customer.old_loan || 0;
            let newTotalLoan = customer.total_loan || 0;

            if (newOldLoan > 0) {
                if (remainingPayment >= newOldLoan) {
                    remainingPayment -= newOldLoan;
                    newOldLoan = 0;
                } else {
                    newOldLoan -= remainingPayment;
                    remainingPayment = 0;
                }
            }

            if (remainingPayment > 0) {
                newTotalLoan -= remainingPayment;
            }

            const updateStmt = db.prepare("UPDATE customers SET old_loan = ?, total_loan = ? WHERE id = ?");
            updateStmt.run(newOldLoan, newTotalLoan, customerId);

            const insertStmt = db.prepare("INSERT INTO payments (customer_id, amount) VALUES (?, ?)");
            insertStmt.run(customerId, amount);
        });

        transaction();

        // Revalidate paths reflecting this change
        revalidatePath("/customers");
        revalidatePath("/");

        return { success: true };
    } catch (err) {
        return { error: (err as Error).message };
    }
}

export async function deleteCustomer(customerId: number) {
    try {
        const db = getDb();

        // Cascading Unconstrained Deletion:
        const transaction = db.transaction(() => {
            // Find all sales belonging to this customer
            const sales = db.prepare("SELECT id FROM sales WHERE customer_id = ?").all(customerId) as { id: number }[];

            // Delete all batch assignments linked to those sales
            const deleteAssignmentsStmt = db.prepare("DELETE FROM sale_batch_assignments WHERE sale_id = ?");
            for (const sale of sales) {
                deleteAssignmentsStmt.run(sale.id);
            }

            // Delete the sales themselves
            db.prepare("DELETE FROM sales WHERE customer_id = ?").run(customerId);

            // Delete all historical payments
            db.prepare("DELETE FROM payments WHERE customer_id = ?").run(customerId);

            // Finally, drop the primary customer record
            db.prepare("DELETE FROM customers WHERE id = ?").run(customerId);
        });

        transaction();

        revalidatePath("/");
        revalidatePath("/customers");
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete customer natively:", e);
        return { error: e.message };
    }
}

export async function updateCustomerLoan(customerId: number, newOldLoan: number, newTotalLoan: number) {
    try {
        const db = getDb();

        if (isNaN(newOldLoan) || newOldLoan < 0 || isNaN(newTotalLoan) || newTotalLoan < 0) {
            throw new Error("Invalid loan structure.");
        }

        db.prepare("UPDATE customers SET old_loan = ?, total_loan = ? WHERE id = ?").run(newOldLoan, newTotalLoan, customerId);

        revalidatePath("/");
        revalidatePath("/customers");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
