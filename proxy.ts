import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const authCookie = request.cookies.get("gramflow_auth");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");
  let isValid = false;
  if (authCookie?.value && process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    try {
      const { payload } = await jwtVerify(authCookie.value, new TextEncoder().encode(process.env.JWT_SECRET), { issuer: "gramflow", audience: "gramflow-web" });
      isValid = [Number(payload.sub), Number(payload.sv), Number(payload.bid)].every((value) => Number.isSafeInteger(value) && value > 0);
    } catch { isValid = false; }
  }
  if (!isValid) {
    const response = isAuthPage ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
    if (authCookie) response.cookies.delete("gramflow_auth");
    return response;
  }
  if (isValid && request.nextUrl.pathname.startsWith("/login")) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand-mark.svg|manifest.json).*)"] };
