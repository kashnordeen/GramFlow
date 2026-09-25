import { getJournalEntries } from "@/lib/actions/compliance.actions";
import { BookOpenText } from "lucide-react";
import { WorkspaceHeader, WorkspaceSection } from "@/components/ui/Workspace";

export default async function AccountingPage() {
  const entries = await getJournalEntries();
  return <div className="workspace-page">
    <WorkspaceHeader eyebrow="FINANCE / DOUBLE-ENTRY" title="Accounting journal" description="A balanced record of every posted financial movement." aside={<div className="workspace-hero-stat"><span>Journal entries</span><strong>{entries.length}</strong></div>} />
    <WorkspaceSection title="Posted entries" description="Expand an entry to inspect its debit and credit lines." aside={<span className="work-pill"><BookOpenText size={14} aria-hidden="true" /> Immutable ledger</span>} />
    <div className="workspace-panel data-scroll">
      <table className="data-table"><thead><tr><th>Entry</th><th>Type</th><th>Reference</th><th>Description and lines</th><th>Debit</th><th>Credit</th><th>Posted by</th><th>Date</th></tr></thead>
      <tbody>{entries.map((entry) => <tr key={entry.id}>
        <td><strong>{entry.entry_number}</strong></td><td><span className="work-pill">{entry.transaction_type}</span></td><td>{entry.reference_type} #{entry.reference_id}</td>
        <td><details className="ledger-disclosure"><summary>{entry.description}</summary><div>{entry.lines.map((line, index) => <div className="ledger-line" key={`${entry.id}-${index}`}><span>{line.account_code} · {line.account_name}</span><span>Dr ₹{Number(line.debit).toFixed(2)}</span><span>Cr ₹{Number(line.credit).toFixed(2)}</span></div>)}</div></details></td>
        <td className="numeric">₹{entry.total_debit.toFixed(2)}</td><td className="numeric">₹{entry.total_credit.toFixed(2)}</td><td>{entry.created_by_name}</td><td>{new Date(entry.created_at).toLocaleString()}</td>
      </tr>)}{entries.length === 0 && <tr><td colSpan={8} className="work-empty">No journal entries yet. Posted sales and payments will appear here.</td></tr>}</tbody></table>
    </div>
  </div>;
}
