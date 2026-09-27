import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { query } from "@/lib/db";
import { SessionUser } from "@/types";
import { readSessionClaims, SESSION_COOKIE, sessionSecret } from "./session-token";

export async function createSession(userId: number, sessionVersion: number, businessId: number): Promise<void> {
  const token = await new SignJWT({ sub: String(userId), sv: sessionVersion, bid: businessId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer("gramflow").setAudience("gramflow-web").setExpirationTime("7d").sign(sessionSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> { (await cookies()).delete(SESSION_COOKIE); }

export async function getSessionUser(): Promise<SessionUser | null> {
  const claims = await readSessionClaims();
  if (!claims) return null;
  try {
    const result = await query<SessionUser & { session_version: number }>(
      `SELECT u.id, u.email, u.name, u.session_version, (u.password_hash IS NOT NULL) AS has_password,
              b.id AS business_id, b.name AS business_name, b.slug AS business_slug, b.setup_complete,
              COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
              COALESCE(array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '{}') AS permissions
       FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.business_id = $2 AND ur.is_active
       JOIN businesses b ON b.id = ur.business_id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1 AND u.is_active = TRUE GROUP BY u.id,b.id`, [claims.userId, claims.businessId]);
    const user = result.rows[0];
    return user && user.session_version === claims.sessionVersion ? user : null;
  } catch { return null; }
}
