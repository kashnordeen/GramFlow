import { getAllSales } from "@/lib/actions/sale.actions";
import { TransactionsClient } from "@/components/ui/TransactionsClient";
import { Database } from "lucide-react";
import { WorkspaceHeader, WorkspaceSection } from "@/components/ui/Workspace";

export default async function TransactionsPage() {
    const allSales = await getAllSales();

    return (
        <div className="workspace-page">
            <WorkspaceHeader eyebrow="ACTIVITY / SALES LEDGER" title="Transactions" description="Search recorded sales, review balances and open receipts from one timeline." aside={<div className="workspace-hero-stat"><span>Total records</span><strong>{allSales?.length || 0}</strong></div>} />
            <WorkspaceSection title="Sales history" description="Filter by customer, amount or payment status." aside={<span className="work-pill"><Database size={14} aria-hidden="true" /> Ledger records</span>} />
            <TransactionsClient initialSales={allSales} />
        </div>
    );
}
