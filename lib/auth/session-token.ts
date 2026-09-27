import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const SESSION_COOKIE = "gramflow_auth";

export function sessionSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function readSessionClaims(): Promise<{ userId: number; businessId: number; sessionVersion: number } | null> {
  let token: string | undefined;
  try { token = (await cookies()).get(SESSION_COOKIE)?.value; } catch { return null; }
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { issuer: "gramflow", audience: "gramflow-web" });
    const userId = Number(payload.sub);
    const businessId = Number(payload.bid);
    const sessionVersion = Number(payload.sv);
    if (![userId, businessId, sessionVersion].every((value) => Number.isSafeInteger(value) && value > 0)) return null;
    return { userId, businessId, sessionVersion };
  } catch { return null; }
}
