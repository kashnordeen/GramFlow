import { getAuditLogs } from "@/lib/actions/compliance.actions";
import { ScanEye } from "lucide-react";
import { WorkspaceHeader, WorkspaceSection } from "@/components/ui/Workspace";

export default async function AuditPage() {
  const logs = await getAuditLogs();
  return <div className="workspace-page">
    <WorkspaceHeader eyebrow="COMPLIANCE / ACTIVITY" title="Audit trail" description="A server-generated timeline of important changes and access events." aside={<div className="workspace-hero-stat"><span>Recorded events</span><strong>{logs.length}</strong></div>} />
    <WorkspaceSection title="Recent activity" description="Review who did what, when, and to which record." aside={<span className="work-pill"><ScanEye size={14} aria-hidden="true" /> Server recorded</span>} />
    <div className="workspace-panel data-scroll"><table className="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
      <tbody>{logs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td><strong>{log.actor_name || "System"}</strong></td><td><span className="work-pill">{log.action}</span></td><td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</td><td><details className="ledger-disclosure"><summary>View metadata</summary><code>{JSON.stringify(log.metadata, null, 2)}</code></details></td></tr>)}{logs.length === 0 && <tr><td colSpan={5} className="work-empty">No audit events have been recorded yet.</td></tr>}</tbody></table></div>
  </div>;
}
