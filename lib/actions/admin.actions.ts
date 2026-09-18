"use server";

import { query, withTransaction } from "../db";
import { requirePermission } from "../auth/authorization";
import { writeAuditLog } from "../audit";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";
import bcrypt from "bcryptjs";
import { allowedEmailDomain, isEmailAllowed, normalizeEmail, validatePassword } from "../auth/policy";

export interface AccessUser { id: number; email: string; name: string; roles: string[]; is_active: boolean; }
export interface AccessRole { id: number; name: string; description: string; permissions: string[]; }

export async function getAccessAdminData(): Promise<{ users: AccessUser[]; roles: AccessRole[] }> {
  await requirePermission("roles.read");
  const [users, roles] = await Promise.all([
    query<AccessUser>(`SELECT u.id,u.email,u.name,u.is_active,COALESCE(array_agg(DISTINCT r.name) FILTER(WHERE r.name IS NOT NULL),'{}') AS roles FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id GROUP BY u.id ORDER BY u.email`),
    query<AccessRole>(`SELECT r.id,r.name,r.description,COALESCE(array_agg(p.name ORDER BY p.name) FILTER(WHERE p.name IS NOT NULL),'{}') AS permissions FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id LEFT JOIN permissions p ON p.id=rp.permission_id GROUP BY r.id ORDER BY r.name`),
  ]);
  return { users: users.rows, roles: roles.rows };
}

export async function createUserAction(nameRaw: string, emailRaw: string, passwordRaw: string, roleId: number): Promise<ActionResult> {
  const name = nameRaw.trim();
  const email = normalizeEmail(emailRaw);
  if (!name) return { error: "Name is required." };
  if (!isEmailAllowed(email)) return { error: `Use an @${allowedEmailDomain()} address.` };
  const passwordError = validatePassword(passwordRaw);
  if (passwordError) return { error: passwordError };
  try {
    const actor = await requirePermission("users.create");
    const passwordHash = await bcrypt.hash(passwordRaw, 12);
    await withTransaction(async (client) => {
      const role = await client.query<{ name: string }>("SELECT name FROM roles WHERE id=$1", [roleId]);
      if (!role.rows[0]) throw new Error("Role was not found.");
      const user = await client.query<{ id: number }>("INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id", [email, name, passwordHash]);
      await client.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)", [user.rows[0].id, roleId]);
      await writeAuditLog(client, { userId: actor.id, action: "user.create", entityType: "user", entityId: user.rows[0].id, metadata: { email, role: role.rows[0].name } });
    });
    revalidatePath("/admin/roles"); revalidatePath("/audit"); return { success: true };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { error: "A user with this email already exists." };
    return { error: error instanceof Error ? error.message : "User creation failed" };
  }
}

export async function setUserActive(userId: number, active: boolean): Promise<ActionResult> {
  try {
    const actor = await requirePermission(active ? "users.update" : "users.delete");
    if (actor.id === userId && !active) throw new Error("You cannot disable your own account.");
    await withTransaction(async (client) => {
      const roles = await client.query<{ name: string }>("SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1", [userId]);
      if (!active && roles.rows.some((item) => item.name === "ADMIN")) {
        const count = await client.query<{ count: number }>("SELECT count(DISTINCT ur.user_id)::int AS count FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.name='ADMIN' AND u.is_active");
        if (count.rows[0].count <= 1) throw new Error("The final active administrator cannot be disabled.");
      }
      const updated = await client.query("UPDATE users SET is_active=$1,session_version=session_version+1,updated_at=now() WHERE id=$2 RETURNING id,email", [active, userId]);
      if (!updated.rows[0]) throw new Error("User was not found.");
      await writeAuditLog(client, { userId: actor.id, action: active ? "user.enable" : "user.disable", entityType: "user", entityId: userId, metadata: { email: updated.rows[0].email } });
    });
    revalidatePath("/admin/roles"); revalidatePath("/audit"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "User update failed" }; }
}

export async function assignUserRole(userId: number, roleId: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("roles.manage");
    await withTransaction(async (client) => {
      const user = await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [userId]);
      const role = await client.query<{ name: string }>("SELECT name FROM roles WHERE id=$1", [roleId]);
      if (!user.rows[0] || !role.rows[0]) throw new Error("User or role was not found.");
      const currentRoles = await client.query<{ name: string }>("SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1", [userId]);
      if (currentRoles.rows.some((item) => item.name === "ADMIN") && role.rows[0].name !== "ADMIN") {
        const adminCount = await client.query<{ count: number }>("SELECT count(DISTINCT ur.user_id)::int AS count FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.name='ADMIN'");
        if (adminCount.rows[0].count <= 1) throw new Error("The final administrator cannot be reassigned.");
      }
      await client.query("DELETE FROM user_roles WHERE user_id=$1", [userId]);
      await client.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)", [userId, roleId]);
      await writeAuditLog(client, { userId: actor.id, action: "role.assign", entityType: "user", entityId: userId, metadata: { role: role.rows[0].name } });
    });
    revalidatePath("/admin/roles"); revalidatePath("/audit"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Role assignment failed" }; }
}
