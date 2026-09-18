"use server";

import { query } from "../db";
import { requirePermission } from "../auth/authorization";
import { AuditLog, JournalEntry } from "@/types";

export async function getJournalEntries(): Promise<JournalEntry[]> {
  await requirePermission("accounting.read");
  return (await query<JournalEntry>(`SELECT je.id,je.entry_number,je.transaction_type,je.reference_type,je.reference_id,je.description,
    u.name AS created_by_name,je.created_at,sum(jl.debit) AS total_debit,sum(jl.credit) AS total_credit,
    json_agg(json_build_object('account_code',a.account_code,'account_name',a.account_name,'debit',jl.debit,'credit',jl.credit,'description',jl.description) ORDER BY jl.id) AS lines
    FROM journal_entries je JOIN users u ON u.id=je.created_by JOIN journal_lines jl ON jl.journal_entry_id=je.id JOIN accounts a ON a.id=jl.account_id
    GROUP BY je.id,u.name ORDER BY je.created_at DESC,je.id DESC LIMIT 250`)).rows;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  await requirePermission("audit.read");
  return (await query<AuditLog>(`SELECT a.id,u.name AS actor_name,a.action,a.entity_type,a.entity_id,a.metadata,a.created_at
    FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC,a.id DESC LIMIT 500`)).rows;
}
