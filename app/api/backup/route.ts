import { requirePermission } from "@/lib/auth/authorization";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await requirePermission("roles.manage");
    const tables = ["customers", "stock_batches", "sales", "sale_batch_assignments", "payments", "settings", "roles", "permissions", "user_roles", "role_permissions", "accounts", "journal_entries", "journal_lines", "audit_logs"];
    const data: Record<string, unknown[]> = {
      users: (await query("SELECT id,email,name,is_active,created_at,updated_at FROM users ORDER BY id")).rows,
    };
    for (const table of tables) data[table] = (await query(`SELECT * FROM ${table} ORDER BY 1`)).rows;
    const date = new Date().toISOString().slice(0, 10);
    return Response.json({ format: "gramflow-postgresql-logical-backup-v1", exportedAt: new Date().toISOString(), data }, {
      headers: {
        "Content-Disposition": `attachment; filename="gramflow-backup-${date}.json"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof Error && error.name === "AuthorizationError" ? 403 : 500;
    return new Response(status === 403 ? "Forbidden" : "Backup generation failed", { status });
  }
}
