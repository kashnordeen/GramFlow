import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { query } from "@/lib/db";
import { SessionUser } from "@/types";

const COOKIE_NAME = "gramflow_auth";

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createSession(userId: number, sessionVersion: number): Promise<void> {
  const token = await new SignJWT({ sub: String(userId), sv: sessionVersion }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer("gramflow").setAudience("gramflow-web").setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> { (await cookies()).delete(COOKIE_NAME); }

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "gramflow", audience: "gramflow-web" });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const result = await query<SessionUser & { session_version: number }>(
      `SELECT u.id, u.email, u.name, u.session_version,
              COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
              COALESCE(array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '{}') AS permissions
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1 AND u.is_active = TRUE GROUP BY u.id`, [id]);
    const user = result.rows[0];
    return user && user.session_version === Number(payload.sv) ? user : null;
  } catch { return null; }
}
