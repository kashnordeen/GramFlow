import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { exchangeGoogleCode, GOOGLE_FLOW_COOKIE, readGoogleFlow, verifyGoogleIdentity } from "@/lib/auth/google";
import { withTransaction } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

function finish(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/google", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flowCookie = request.cookies.get(GOOGLE_FLOW_COOKIE)?.value;
  const state = params.get("state") || "";
  const code = params.get("code") || "";
  if (!flowCookie || !state) return finish(request, "/login?google_error=cancelled");

  let intent: "login" | "signup" = "login";
  try {
    const flow = await readGoogleFlow(flowCookie, state);
    intent = flow.intent;
    if (!code || params.has("error")) return finish(request, `/${intent}?google_error=cancelled`);
    const idToken = await exchangeGoogleCode(code, flow.verifier);
    const identity = await verifyGoogleIdentity(idToken, flow.nonce);
    const user = await withTransaction(async (client) => {
      if (flow.intent === "signup") {
        await client.query("SELECT pg_advisory_xact_lock(hashtext('gramflow-bootstrap'))");
        const count = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM users");
        if (count.rows[0].count > 0) throw new Error("BOOTSTRAP_CLOSED");
        const inserted = await client.query<{ id: number; session_version: number }>(
          "INSERT INTO users(email,name,password_hash,google_subject) VALUES($1,$2,NULL,$3) RETURNING id,session_version",
          [identity.email, identity.name || "Admin", identity.subject]);
        const current = inserted.rows[0];
        await client.query("INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE name='ADMIN'", [current.id]);
        await writeAuditLog(client, { userId: current.id, action: "user.create", entityType: "user", entityId: current.id, metadata: { email: identity.email, provider: "google", initialRole: "ADMIN" } });
        return current;
      }

      const result = await client.query<{ id: number; email: string; google_subject: string | null; session_version: number; is_active: boolean }>(
        "SELECT id,email,google_subject,session_version,is_active FROM users WHERE google_subject=$1 OR email=$2 FOR UPDATE",
        [identity.subject, identity.email]);
      if (result.rows.length !== 1) throw new Error("ACCOUNT_NOT_FOUND");
      const current = result.rows[0];
      if (!current.is_active || current.email !== identity.email || (current.google_subject && current.google_subject !== identity.subject)) throw new Error("ACCOUNT_NOT_FOUND");
      if (!current.google_subject) await client.query("UPDATE users SET google_subject=$1,updated_at=now() WHERE id=$2", [identity.subject, current.id]);
      await writeAuditLog(client, { userId: current.id, action: "auth.login", entityType: "user", entityId: current.id, metadata: { provider: "google" } });
      return current;
    });
    await createSession(user.id, user.session_version);
    return finish(request, "/");
  } catch (error) {
    if (error instanceof Error && error.message === "BOOTSTRAP_CLOSED") return finish(request, "/signup?google_error=closed");
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") return finish(request, "/login?google_error=account");
    if (error instanceof Error && error.message.startsWith("Use a verified")) return finish(request, `/${intent}?google_error=domain`);
    console.error("Google authentication failed:", error);
    return finish(request, `/${intent}?google_error=failed`);
  }
}
