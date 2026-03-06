import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_KEY = process.env.JWT_SECRET || "default_fallback_secret_change_me_in_prod";
const encodedKey = new TextEncoder().encode(JWT_SECRET_KEY);

export async function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('gramflow_auth')
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')

    let isValid = false;

    if (authCookie && authCookie.value) {
        try {
            await jwtVerify(authCookie.value, encodedKey);
            isValid = true;
        } catch (error) {
            isValid = false;
        }
    }

    if (!isValid && !isAuthPage) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('gramflow_auth')
        return response
    }

    if (isValid && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
}
