import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { allowedEmailDomain, isEmailAllowed, normalizeEmail } from "./policy";

export const GOOGLE_FLOW_COOKIE = "gramflow_google_flow";
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function appSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  return new TextEncoder().encode(value);
}

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  let parsed: URL;
  try { parsed = new URL(redirectUri); } catch { return null; }
  if (parsed.pathname !== "/api/auth/google/callback" || parsed.search || parsed.hash || (parsed.protocol !== "https:" && parsed.hostname !== "localhost") || (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")) return null;
  return { clientId, clientSecret, redirectUri };
}

export function checkRegistrationCode(code: string) {
  const expected = process.env.REGISTRATION_CODE;
  if (!expected) return false;
  const left = createHash("sha256").update(code).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function createGoogleFlow(intent: "login" | "signup") {
  const config = googleConfig();
  if (!config) throw new Error("Google sign-in is not configured.");
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const flow = await new SignJWT({ state, nonce, verifier, intent })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("gramflow-google-flow")
    .setAudience("gramflow-google-callback").setIssuedAt().setExpirationTime("10m").sign(appSecret());
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("hd", allowedEmailDomain());
  return { url: url.toString(), flow };
}

export async function readGoogleFlow(token: string, returnedState: string) {
  const { payload } = await jwtVerify(token, appSecret(), { issuer: "gramflow-google-flow", audience: "gramflow-google-callback" });
  if (typeof payload.state !== "string" || typeof payload.nonce !== "string" || typeof payload.verifier !== "string" || (payload.intent !== "login" && payload.intent !== "signup")) throw new Error("Invalid Google sign-in state.");
  const a = Buffer.from(payload.state);
  const b = Buffer.from(returnedState);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid Google sign-in state.");
  return { nonce: payload.nonce, verifier: payload.verifier, intent: payload.intent as "login" | "signup" };
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const config = googleConfig();
  if (!config) throw new Error("Google sign-in is not configured.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store",
    body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code", code_verifier: verifier }),
  });
  if (!response.ok) throw new Error("Google could not complete sign-in.");
  const data = await response.json() as { id_token?: string };
  if (!data.id_token) throw new Error("Google did not return an identity token.");
  return data.id_token;
}

export async function verifyGoogleIdentity(idToken: string, nonce: string) {
  const config = googleConfig();
  if (!config) throw new Error("Google sign-in is not configured.");
  const { payload } = await jwtVerify(idToken, googleKeys, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: config.clientId, algorithms: ["RS256"] });
  if (payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== "string" || typeof payload.sub !== "string" || !payload.sub || (payload.azp && payload.azp !== config.clientId)) throw new Error("Google identity could not be verified.");
  const email = normalizeEmail(payload.email);
  const domain = allowedEmailDomain();
  if (!isEmailAllowed(email) || (domain !== "gmail.com" && payload.hd !== domain)) throw new Error(`Use a verified @${domain} Google Workspace account.`);
  return { email, subject: payload.sub, name: typeof payload.name === "string" ? payload.name.trim().slice(0, 120) : email.split("@")[0] };
}
