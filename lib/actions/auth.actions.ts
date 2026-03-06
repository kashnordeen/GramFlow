"use server";
import { cookies } from "next/headers";
import { getDb } from "../db";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET_KEY = process.env.JWT_SECRET || "default_fallback_secret_change_me_in_prod";
const encodedKey = new TextEncoder().encode(JWT_SECRET_KEY);

export async function signupAction(email: string, passwordRaw: string, name: string, registrationCode: string) {
    const validRegistrationCode = process.env.REGISTRATION_CODE || "gramflow_admin_init";

    if (registrationCode !== validRegistrationCode) {
        return { error: "Access Denied. Invalid registration code provided." };
    }
    if (!email.toLowerCase().endsWith("@hemp.com")) {
        return { error: "Access Denied. You must use an @hemp.com administrator address to register." };
    }

    if (passwordRaw.length < 8) {
        return { error: "Password must be at least 8 characters long." };
    }

    try {
        const db = getDb();
        const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());

        if (existing) {
            return { error: "An account with this email already exists." };
        }

        const password_hash = await bcrypt.hash(passwordRaw, 10);
        db.prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)").run(email.toLowerCase(), password_hash, name);

        const token = await new SignJWT({ email: email.toLowerCase() })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(encodedKey);

        const cookieStore = await cookies();
        cookieStore.set("gramflow_auth", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });

        return { success: true };
    } catch (e: any) {
        console.error("Signup error:", e);
        return { error: "Failed to create account. Please try again." };
    }
}

export async function loginAction(email: string, passwordRaw: string) {
    if (!email.toLowerCase().endsWith("@hemp.com")) {
        return { error: "Access Denied. You must use an @hemp.com administrator account." };
    }

    try {
        const db = getDb();
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;

        if (!user) {
            return { error: "Invalid email or password." };
        }

        const isValid = await bcrypt.compare(passwordRaw, user.password_hash);

        if (!isValid) {
            return { error: "Invalid email or password." };
        }

        const token = await new SignJWT({ email: email.toLowerCase() })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(encodedKey);

        const cookieStore = await cookies();
        cookieStore.set("gramflow_auth", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });
        return { success: true };
    } catch (e: any) {
        console.error("Login Error:", e);
        return { error: "Server error during authentication." };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("gramflow_auth");
}

export async function getSessionUser() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("gramflow_auth");

    if (!authCookie || !authCookie.value) {
        return null;
    }

    let email: string;
    try {
        const { payload } = await jwtVerify(authCookie.value, encodedKey);
        email = payload.email as string;
    } catch (e) {
        // Silently swallow JWT parse errors from old, plaintext cookies
        // to prevent Next.js from aggressively showing a Dev Overlay.
        // The middleware will automatically redirect them to login anyway.
        return null;
    }

    try {
        const db = getDb();
        const user = db.prepare("SELECT email, name FROM users WHERE email = ?").get(email) as any;
        return user ? { email: user.email, name: user.name } : null;
    } catch (e: any) {
        console.error("Session lookup error:", e);
        return null;
    }
}

export async function updateProfileData(email: string, currentPasswordRaw: string, newPasswordRaw?: string, newName?: string) {
    try {
        const db = getDb();
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;

        if (!user) {
            return { error: "Security Error: Authentication baseline failed. Email not found." };
        }

        const isValid = await bcrypt.compare(currentPasswordRaw, user.password_hash);

        if (!isValid) {
            return { error: "Authentication failed. The current password provided is incorrect." };
        }

        if (newName) {
            db.prepare("UPDATE users SET name = ? WHERE email = ?").run(newName, email.toLowerCase());
        }

        if (newPasswordRaw) {
            if (newPasswordRaw.length < 8) {
                return { error: "New password must be at least 8 characters long." };
            }
            const new_password_hash = await bcrypt.hash(newPasswordRaw, 10);
            db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(new_password_hash, email.toLowerCase());
        }

        return { success: true };
    } catch (e: any) {
        console.error("Profile update error:", e);
        return { error: "An unexpected error occurred while updating standard credentials." };
    }
}
