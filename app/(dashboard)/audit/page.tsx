import { getAuditLogs } from "@/lib/actions/compliance.actions";

export default async function AuditPage() {
  const logs = await getAuditLogs();
  return <div className="page-container"><div className="page-header"><div><h1>Audit Log</h1><p>Immutable server-generated history of important changes.</p></div></div>
    <div className="card" style={{ overflowX: "auto" }}><table className="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Metadata</th></tr></thead>
      <tbody>{logs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td>{log.actor_name || "System"}</td><td>{log.action}</td><td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</td><td><code>{JSON.stringify(log.metadata)}</code></td></tr>)}</tbody></table></div></div>;
}
