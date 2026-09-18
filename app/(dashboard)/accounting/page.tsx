import { getJournalEntries } from "@/lib/actions/compliance.actions";

export default async function AccountingPage() {
  const entries = await getJournalEntries();
  return <div className="page-container"><div className="page-header"><div><h1>Accounting Journal</h1><p>Immutable, balanced double-entry postings.</p></div></div>
    <div className="card" style={{ overflowX: "auto" }}><table className="data-table"><thead><tr><th>Entry</th><th>Type</th><th>Reference</th><th>Description</th><th>Debit</th><th>Credit</th><th>Posted by</th><th>Date</th></tr></thead>
      <tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.entry_number}</td><td>{entry.transaction_type}</td><td>{entry.reference_type} #{entry.reference_id}</td><td><details><summary style={{ cursor: "pointer" }}>{entry.description}</summary><div style={{ marginTop: "0.5rem" }}>{entry.lines.map((line, index) => <div key={`${entry.id}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", fontSize: "0.8rem" }}><span>{line.account_code} · {line.account_name}</span><span>Dr ₹{Number(line.debit).toFixed(2)}</span><span>Cr ₹{Number(line.credit).toFixed(2)}</span></div>)}</div></details></td><td>₹{entry.total_debit.toFixed(2)}</td><td>₹{entry.total_credit.toFixed(2)}</td><td>{entry.created_by_name}</td><td>{new Date(entry.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></div>;
}
