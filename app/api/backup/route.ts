import { requirePermission } from "@/lib/auth/authorization";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const actor = await requirePermission("roles.manage");
    const tables = ["customers", "stock_batches", "sales", "sale_batch_assignments", "payments", "settings", "roles", "permissions", "role_permissions", "accounts", "journal_entries", "journal_lines", "audit_logs", "rate_ranges"];
    const data: Record<string, unknown[]> = {
      businesses: (await query("SELECT id,name,slug,setup_complete,created_at FROM businesses WHERE id=$1", [actor.business_id])).rows,
      users: (await query("SELECT DISTINCT u.id,u.email,u.name,u.is_active,u.created_at,u.updated_at FROM users u JOIN user_roles ur ON ur.user_id=u.id WHERE ur.business_id=$1 ORDER BY u.id", [actor.business_id])).rows,
      user_roles: (await query("SELECT * FROM user_roles WHERE business_id=$1 ORDER BY user_id,role_id", [actor.business_id])).rows,
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
