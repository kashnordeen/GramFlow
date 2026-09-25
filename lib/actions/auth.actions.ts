"use server";

import bcrypt from "bcryptjs";
import { query, withTransaction } from "../db";
import { createSession, clearSession, getSessionUser as readSessionUser } from "../auth/session";
import { requireAuthenticatedUser } from "../auth/authorization";
import { writeAuditLog } from "../audit";
import { ActionResult, SessionUser } from "@/types";
import { allowedEmailDomain, isEmailAllowed, normalizeEmail, validatePassword } from "../auth/policy";

interface DbUserRow { id: number; email: string; name: string; password_hash: string | null; google_subject: string | null; session_version: number; }

export async function signupAction(emailRaw: string, passwordRaw: string, name: string, registrationCode: string): Promise<ActionResult> {
  const expectedCode = process.env.REGISTRATION_CODE;
  if (!expectedCode || registrationCode !== expectedCode) return { error: "Access Denied. Invalid registration code provided." };
  const email = normalizeEmail(emailRaw);
  if (!isEmailAllowed(email)) return { error: `Use an @${allowedEmailDomain()} address.` };
  const passwordError = validatePassword(passwordRaw);
  if (passwordError) return { error: passwordError };
  try {
    const passwordHash = await bcrypt.hash(passwordRaw, 12);
    const user = await withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('gramflow-bootstrap'))");
      const existing = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM users");
      if (existing.rows[0].count > 0) throw new Error("BOOTSTRAP_CLOSED");
      const inserted = await client.query<{ id: number; session_version: number }>(
        "INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id,session_version", [email, passwordHash, name.trim() || "Admin"]);
      const id = inserted.rows[0].id;
      await client.query(`INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE name='ADMIN'`, [id]);
      await writeAuditLog(client, { userId: id, action: "user.create", entityType: "user", entityId: id, metadata: { email, initialRole: "ADMIN" } });
      return inserted.rows[0];
    });
    await createSession(user.id, user.session_version);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "BOOTSTRAP_CLOSED") return { error: "Initial registration is closed. Ask an administrator to create your account." };
    console.error("Signup error:", error);
    return { error: "Failed to create account. Please try again." };
  }
}

export async function loginAction(emailRaw: string, passwordRaw: string): Promise<ActionResult> {
  const email = normalizeEmail(emailRaw);
  if (!isEmailAllowed(email)) return { error: "Invalid email or password." };
  try {
    const attempt = await query<{ locked_until: string | null }>("SELECT locked_until FROM auth_login_attempts WHERE email=$1", [email]);
    if (attempt.rows[0]?.locked_until && new Date(attempt.rows[0].locked_until) > new Date()) {
      return { error: "Too many failed attempts. Try again in 15 minutes." };
    }
    const result = await query<DbUserRow>("SELECT id,email,name,password_hash,session_version FROM users WHERE email=$1 AND is_active=TRUE", [email]);
    const user = result.rows[0];
    if (!user || !user.password_hash || !(await bcrypt.compare(passwordRaw, user.password_hash))) {
      await withTransaction(async (client) => {
        await client.query(`INSERT INTO auth_login_attempts(email,failed_count) VALUES($1,1)
          ON CONFLICT(email) DO UPDATE SET
            failed_count=CASE WHEN auth_login_attempts.first_failed_at<now()-interval '15 minutes' THEN 1 ELSE auth_login_attempts.failed_count+1 END,
            first_failed_at=CASE WHEN auth_login_attempts.first_failed_at<now()-interval '15 minutes' THEN now() ELSE auth_login_attempts.first_failed_at END,
            locked_until=CASE WHEN (CASE WHEN auth_login_attempts.first_failed_at<now()-interval '15 minutes' THEN 1 ELSE auth_login_attempts.failed_count+1 END)>=5 THEN now()+interval '15 minutes' ELSE NULL END,
            updated_at=now()`, [email]);
        await writeAuditLog(client, { userId: user?.id ?? null, action: "auth.login_failed", entityType: "user", entityId: user?.id ?? null, metadata: { email } });
      });
      return { error: "Invalid email or password." };
    }
    await withTransaction(async (client) => {
      await client.query("DELETE FROM auth_login_attempts WHERE email=$1", [email]);
      await writeAuditLog(client, { userId: user.id, action: "auth.login", entityType: "user", entityId: user.id });
    });
    await createSession(user.id, user.session_version);
    return { success: true };
  } catch (error) { console.error("Login error:", error); return { error: "Server error during authentication." }; }
}

export async function logoutAction(): Promise<void> { await clearSession(); }
export async function getSessionUser(): Promise<SessionUser | null> { return readSessionUser(); }

export async function updateProfileData(email: string, currentPasswordRaw: string, newPasswordRaw?: string, newName?: string): Promise<ActionResult> {
  try {
    const actor = await requireAuthenticatedUser();
    if (actor.email !== email.toLowerCase()) return { error: "You may only update your own profile." };
    const result = await query<DbUserRow>("SELECT id,email,name,password_hash,google_subject,session_version FROM users WHERE id=$1", [actor.id]);
    const user = result.rows[0];
    if (!user) return { error: "Account not found." };
    if (user.password_hash && !(await bcrypt.compare(currentPasswordRaw, user.password_hash))) return { error: "Authentication failed. The current password is incorrect." };
    if (!user.password_hash && (!user.google_subject || newPasswordRaw)) return { error: "Password changes are not available for Google-only accounts." };
    const passwordError = newPasswordRaw ? validatePassword(newPasswordRaw) : null;
    if (passwordError) return { error: passwordError };
    const passwordHash = newPasswordRaw ? await bcrypt.hash(newPasswordRaw, 12) : null;
    const sessionVersion = await withTransaction(async (client) => {
      const updated = await client.query<{ session_version: number }>(`UPDATE users SET name=COALESCE($1,name),password_hash=COALESCE($2,password_hash),session_version=session_version+CASE WHEN $2::text IS NULL THEN 0 ELSE 1 END,updated_at=now() WHERE id=$3 RETURNING session_version`, [newName?.trim() || null, passwordHash, user.id]);
      await writeAuditLog(client, { userId: user.id, action: "user.profile_update", entityType: "user", entityId: user.id, metadata: { nameChanged: Boolean(newName), passwordChanged: Boolean(newPasswordRaw) } });
      return updated.rows[0].session_version;
    });
    if (newPasswordRaw) await createSession(user.id, sessionVersion);
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Profile update failed." }; }
}
