import { PoolClient } from "pg";

export interface AuditEvent { userId?: number | null; action: string; entityType: string; entityId?: number | string | null; requestId?: string | null; metadata?: Record<string, unknown>; }
export async function writeAuditLog(client: PoolClient, event: AuditEvent): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, request_id, metadata) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [event.userId ?? null, event.action, event.entityType, event.entityId?.toString() ?? null, event.requestId ?? null, JSON.stringify(event.metadata ?? {})]);
}
