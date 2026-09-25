import { NextRequest, NextResponse } from "next/server";
import { checkRegistrationCode, createGoogleFlow, GOOGLE_FLOW_COOKIE, googleConfig } from "@/lib/auth/google";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid sign-in request." }, { status: 403 });
  if (!googleConfig()) return NextResponse.json({ error: "Google sign-in is not configured yet. Ask an administrator to add Google OAuth credentials." }, { status: 503 });
  let input: { intent?: string; registrationCode?: string };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 }); }
  if (input.intent !== "login" && input.intent !== "signup") return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 });
  if (input.intent === "signup" && !checkRegistrationCode(input.registrationCode || "")) return NextResponse.json({ error: "Invalid registration code." }, { status: 403 });
  try {
    const { url, flow } = await createGoogleFlow(input.intent);
    const response = NextResponse.json({ url });
    response.cookies.set(GOOGLE_FLOW_COOKIE, flow, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/google", maxAge: 600 });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not start Google sign-in. Try again." }, { status: 500 });
  }
}
