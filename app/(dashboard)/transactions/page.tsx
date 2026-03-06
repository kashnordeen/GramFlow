import { getAllSales } from "@/lib/actions/sale.actions";
import { TransactionsClient } from "@/components/ui/TransactionsClient";
import { Database } from "lucide-react";

export default async function TransactionsPage() {
    const allSales = await getAllSales();

    return (
        <>
            <div className="flex-between" style={{ marginBottom: "2.5rem" }}>
                <div>
                    <h1>Master Transactions Log</h1>
                    <p>Complete historical ledger of all recorded sales and payments.</p>
                </div>
                <div className="glass-card flex-center" style={{ padding: '0.8rem 1.5rem', gap: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                    <Database size={20} className="text-accent" />
                    <span style={{ fontWeight: 600 }}>{allSales?.length || 0} Total Records</span>
                </div>
            </div>

            <TransactionsClient initialSales={allSales} />
        </>
    )
}
