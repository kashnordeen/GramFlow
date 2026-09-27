"use server";

import { query, withTransaction } from "../db";
import { requirePermission } from "../auth/authorization";
import { writeAuditLog } from "../audit";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";
import bcrypt from "bcryptjs";
import { validatePassword } from "../auth/policy";

export interface AccessUser { id: number; email: string; name: string; roles: string[]; is_active: boolean; }
export interface AccessRole { id: number; name: string; description: string; permissions: string[]; }

export async function getAccessAdminData(): Promise<{ users: AccessUser[]; roles: AccessRole[] }> {
  const actor = await requirePermission("roles.read");
  const [users, roles] = await Promise.all([
    query<AccessUser>(`SELECT u.id,u.email,u.name,(bool_or(ur.is_active) AND u.is_active) AS is_active,COALESCE(array_agg(DISTINCT r.name) FILTER(WHERE r.name IS NOT NULL),'{}') AS roles FROM users u JOIN user_roles ur ON ur.user_id=u.id AND ur.business_id=$1 LEFT JOIN roles r ON r.id=ur.role_id GROUP BY u.id ORDER BY u.email`, [actor.business_id]),
    query<AccessRole>(`SELECT r.id,r.name,r.description,COALESCE(array_agg(p.name ORDER BY p.name) FILTER(WHERE p.name IS NOT NULL),'{}') AS permissions FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id LEFT JOIN permissions p ON p.id=rp.permission_id GROUP BY r.id ORDER BY r.name`),
  ]);
  return { users: users.rows, roles: roles.rows };
}

export async function createUserAction(nameRaw: string, handleRaw: string, passwordRaw: string, roleId: number): Promise<ActionResult<string>> {
  const name = nameRaw.trim();
  if (!name) return { error: "Name is required." };
  const handle = handleRaw.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{1,31}$/.test(handle)) return { error: "Worker ID must be 2–32 letters, numbers, dots, underscores or dashes." };
  const passwordError = validatePassword(passwordRaw);
  if (passwordError) return { error: passwordError };
  try {
    const actor = await requirePermission("users.create");
    const loginId = `${handle}@${actor.business_slug}.gramflow`;
    const passwordHash = await bcrypt.hash(passwordRaw, 12);
    await withTransaction(async (client) => {
      const role = await client.query<{ name: string }>("SELECT name FROM roles WHERE id=$1", [roleId]);
      if (!role.rows[0]) throw new Error("Role was not found.");
      const user = await client.query<{ id: number }>("INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id", [loginId, name, passwordHash]);
      await client.query("INSERT INTO user_roles(user_id,role_id,business_id) VALUES($1,$2,$3)", [user.rows[0].id, roleId, actor.business_id]);
      await writeAuditLog(client, { userId: actor.id, action: "user.create", entityType: "user", entityId: user.rows[0].id, metadata: { loginId, role: role.rows[0].name } });
    });
    revalidatePath("/admin/roles"); revalidatePath("/audit"); return { success: true, data: loginId };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { error: "This worker ID already exists." };
    return { error: error instanceof Error ? error.message : "User creation failed" };
  }
}

export async function setUserActive(userId: number, active: boolean): Promise<ActionResult> {
  try {
    const actor = await requirePermission(active ? "users.update" : "users.delete");
    if (actor.id === userId && !active) throw new Error("You cannot disable your own account.");
    await withTransaction(async (client) => {
      const roles = await client.query<{ name: string }>("SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1 AND ur.business_id=$2", [userId, actor.business_id]);
      if (!roles.rows[0]) throw new Error("User was not found in this business.");
      if (!active && roles.rows.some((item) => item.name === "ADMIN")) {
        const count = await client.query<{ count: number }>("SELECT count(DISTINCT ur.user_id)::int AS count FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.name='ADMIN' AND u.is_active AND ur.is_active AND ur.business_id=$1", [actor.business_id]);
        if (count.rows[0].count <= 1) throw new Error("The final active administrator cannot be disabled.");
      }
      await client.query("UPDATE user_roles SET is_active=$1 WHERE user_id=$2 AND business_id=$3", [active, userId, actor.business_id]);
      const updated = await client.query("UPDATE users SET session_version=session_version+1,updated_at=now() WHERE id=$1 RETURNING id,email", [userId]);
      await writeAuditLog(client, { userId: actor.id, action: active ? "user.enable" : "user.disable", entityType: "user", entityId: userId, metadata: { email: updated.rows[0].email } });
    });
    revalidatePath("/admin/roles"); revalidatePath("/audit"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "User update failed" }; }
}

export async function assignUserRole(userId: number, roleId: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("roles.manage");
    await withTransaction(async (client) => {
      const user = await client.query("SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id AND ur.business_id=$2 WHERE u.id=$1 FOR UPDATE OF u", [userId, actor.business_id]);
      const role = await client.query<{ name: string }>("SELECT name FROM roles WHERE id=$1", [roleId]);
      if (!user.rows[0] || !role.rows[0]) throw new Error("User or role was not found.");
      const currentRoles = await client.query<{ name: string; is_active: boolean }>("SELECT r.name,ur.is_active FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1 AND ur.business_id=$2", [userId, actor.business_id]);
      if (currentRoles.rows.some((item) => item.name === "ADMIN") && role.rows[0].name !== "ADMIN") {
        const adminCount = await client.query<{ count: number }>("SELECT count(DISTINCT ur.user_id)::int AS count FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.name='ADMIN' AND ur.business_id=$1 AND ur.is_active", [actor.business_id]);
        if (adminCount.rows[0].count <= 1) throw new Error("The final administrator cannot be reassigned.");
      }
      await client.query("DELETE FROM user_roles WHERE user_id=$1 AND business_id=$2", [userId, actor.business_id]);
      await client.query("INSERT INTO user_roles(user_id,role_id,business_id,is_active) VALUES($1,$2,$3,$4)", [userId, roleId, actor.business_id, currentRoles.rows[0].is_active]);
      await writeAuditLog(client, { userId: actor.id, action: "role.assign", entityType: "user", entityId: userId, metadata: { role: role.rows[0].name } });
    });
    revalidatePath("/admin/roles"); revalidatePath("/audit"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Role assignment failed" }; }
}
