import { getAllSales } from "@/lib/actions/sale.actions";
import { TransactionsClient } from "@/components/ui/TransactionsClient";
import { Database } from "lucide-react";

export default async function TransactionsPage() {
    const allSales = await getAllSales();

    return (
        <>
            <div className="flex-between" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1>Master Transactions Log</h1>
                    <p>Complete historical ledger of all recorded inventory sales and loan payments.</p>
                </div>
                <div className="card-light" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Database size={18} style={{ color: 'var(--text-primary)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{allSales?.length || 0} Total Records</span>
                </div>
            </div>

            <TransactionsClient initialSales={allSales} />
        </>
    );
}
