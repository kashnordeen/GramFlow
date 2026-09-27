import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { exchangeGoogleCode, GOOGLE_FLOW_COOKIE, readGoogleFlow, verifyGoogleIdentity } from "@/lib/auth/google";
import { withTransaction } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { createBusinessForOwner } from "@/lib/business";

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
        const existing = await client.query<{ id: number; email: string; google_subject: string | null; session_version: number; is_active: boolean }>(
          "SELECT id,email,google_subject,session_version,is_active FROM users WHERE google_subject=$1 OR email=$2 FOR UPDATE",
          [identity.subject, identity.email]);
        let current = existing.rows[0];
        if (current && (!current.is_active || current.email !== identity.email || (current.google_subject && current.google_subject !== identity.subject))) throw new Error("ACCOUNT_NOT_FOUND");
        if (!current) {
          const inserted = await client.query<{ id: number; email: string; google_subject: string | null; session_version: number; is_active: boolean }>(
            "INSERT INTO users(email,name,password_hash,google_subject) VALUES($1,$2,NULL,$3) RETURNING id,email,google_subject,session_version,is_active",
            [identity.email, identity.name || "Administrator", identity.subject]);
          current = inserted.rows[0];
        } else if (!current.google_subject) {
          await client.query("UPDATE users SET google_subject=$1,updated_at=now() WHERE id=$2", [identity.subject, current.id]);
        }
        const businessId = await createBusinessForOwner(client, current.id);
        await writeAuditLog(client, { userId: current.id, action: "business.create", entityType: "business", entityId: businessId });
        return { ...current, businessId, setupComplete: false };
      }

      const result = await client.query<{ id: number; email: string; google_subject: string | null; session_version: number; is_active: boolean }>(
        "SELECT id,email,google_subject,session_version,is_active FROM users WHERE google_subject=$1 OR email=$2 FOR UPDATE",
        [identity.subject, identity.email]);
      if (result.rows.length !== 1) throw new Error("ACCOUNT_NOT_FOUND");
      const current = result.rows[0];
      if (!current.is_active || current.email !== identity.email || (current.google_subject && current.google_subject !== identity.subject)) throw new Error("ACCOUNT_NOT_FOUND");
      if (!current.google_subject) await client.query("UPDATE users SET google_subject=$1,updated_at=now() WHERE id=$2", [identity.subject, current.id]);
      const membership = await client.query<{ business_id: number; setup_complete: boolean }>(
        "SELECT ur.business_id,b.setup_complete FROM user_roles ur JOIN businesses b ON b.id=ur.business_id WHERE ur.user_id=$1 AND ur.is_active ORDER BY ur.business_id DESC LIMIT 1",
        [current.id]);
      if (!membership.rows[0]) throw new Error("ACCOUNT_NOT_FOUND");
      const businessId = membership.rows[0].business_id;
      await client.query("SELECT set_config('app.business_id',$1,true)", [String(businessId)]);
      await writeAuditLog(client, { userId: current.id, action: "auth.login", entityType: "user", entityId: current.id, metadata: { provider: "google" } });
      return { ...current, businessId, setupComplete: membership.rows[0].setup_complete };
    });
    await createSession(user.id, user.session_version, user.businessId);
    return finish(request, user.setupComplete ? "/" : "/setup");
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") return finish(request, "/login?google_error=account");
    if (error instanceof Error && error.message.startsWith("Use a verified")) return finish(request, `/${intent}?google_error=domain`);
    console.error("Google authentication failed:", error);
    return finish(request, `/${intent}?google_error=failed`);
  }
}
