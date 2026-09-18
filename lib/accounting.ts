import { PoolClient } from "pg";

export interface JournalLineInput { accountCode: string; debit?: number; credit?: number; description?: string; }
export interface JournalInput { transactionType: string; referenceType: string; referenceId: number | string; description: string; createdBy: number; reversalOfId?: number | null; lines: JournalLineInput[]; }
const rounded = (value: number) => Math.round(value * 100) / 100;

export async function postJournal(client: PoolClient, input: JournalInput): Promise<number> {
  if (input.lines.length < 2) throw new Error("A journal entry requires at least two lines.");
  const debit = rounded(input.lines.reduce((sum, line) => sum + (line.debit ?? 0), 0));
  const credit = rounded(input.lines.reduce((sum, line) => sum + (line.credit ?? 0), 0));
  if (debit <= 0 || debit !== credit) throw new Error("Journal entry is unbalanced.");
  const entry = await client.query<{ id: number }>(
    `INSERT INTO journal_entries (entry_number,transaction_type,reference_type,reference_id,description,created_by,reversal_of_id)
     VALUES ('JE-' || nextval('journal_entry_number_seq'),$1,$2,$3,$4,$5,$6) RETURNING id`,
    [input.transactionType, input.referenceType, String(input.referenceId), input.description, input.createdBy, input.reversalOfId ?? null]);
  const entryId = entry.rows[0].id;
  for (const line of input.lines) {
    const account = await client.query<{ id: number }>("SELECT id FROM accounts WHERE account_code=$1 AND is_active", [line.accountCode]);
    if (!account.rows[0]) throw new Error(`Active account ${line.accountCode} was not found.`);
    await client.query(`INSERT INTO journal_lines (journal_entry_id,account_id,debit,credit,description) VALUES ($1,$2,$3,$4,$5)`,
      [entryId, account.rows[0].id, rounded(line.debit ?? 0), rounded(line.credit ?? 0), line.description ?? null]);
  }
  return entryId;
}

export async function reverseJournals(client: PoolClient, referenceType: string, referenceId: number, createdBy: number, reason: string): Promise<number[]> {
  const originals = await client.query<{ id: number; transaction_type: string }>(
    `SELECT id,transaction_type FROM journal_entries WHERE reference_type=$1 AND reference_id=$2 AND reversal_of_id IS NULL ORDER BY id FOR UPDATE`,
    [referenceType, String(referenceId)]);
  const ids: number[] = [];
  for (const original of originals.rows) {
    const lines = await client.query<{ account_code: string; debit: number; credit: number; description: string | null }>(
      `SELECT a.account_code,jl.debit,jl.credit,jl.description FROM journal_lines jl JOIN accounts a ON a.id=jl.account_id WHERE jl.journal_entry_id=$1 ORDER BY jl.id`, [original.id]);
    ids.push(await postJournal(client, {
      transactionType: `${original.transaction_type}_REVERSAL`, referenceType, referenceId, description: reason, createdBy, reversalOfId: original.id,
      lines: lines.rows.map((line) => ({ accountCode: line.account_code, debit: line.credit, credit: line.debit, description: `Reversal: ${line.description ?? reason}` })),
    }));
  }
  return ids;
}
