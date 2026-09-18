import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const authCookie = request.cookies.get("gramflow_auth");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");
  let isValid = false;
  if (authCookie?.value && process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    try {
      await jwtVerify(authCookie.value, new TextEncoder().encode(process.env.JWT_SECRET), { issuer: "gramflow", audience: "gramflow-web" });
      isValid = true;
    } catch { isValid = false; }
  }
  if (!isValid && !isAuthPage) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("gramflow_auth");
    return response;
  }
  if (isValid && isAuthPage) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)"] };
