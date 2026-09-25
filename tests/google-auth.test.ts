import test from "node:test";
import assert from "node:assert/strict";
import { checkRegistrationCode, createGoogleFlow, readGoogleFlow } from "../lib/auth/google";

test("Google flow binds a short-lived signed cookie to the authorization state", async () => {
  const names = ["JWT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "REGISTRATION_CODE", "ALLOWED_EMAIL_DOMAIN"] as const;
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    JWT_SECRET: "google-flow-test-secret-at-least-32-characters",
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
    REGISTRATION_CODE: "private-code",
    ALLOWED_EMAIL_DOMAIN: "example.com",
  });
  try {
    assert.equal(checkRegistrationCode("private-code"), true);
    assert.equal(checkRegistrationCode("wrong"), false);
    const { url, flow } = await createGoogleFlow("signup");
    const params = new URL(url).searchParams;
    assert.equal(params.get("response_type"), "code");
    assert.equal(params.get("code_challenge_method"), "S256");
    assert.equal(params.get("hd"), "example.com");
    const state = params.get("state")!;
    const decoded = await readGoogleFlow(flow, state);
    assert.equal(decoded.intent, "signup");
    assert.equal(decoded.nonce, params.get("nonce"));
    await assert.rejects(readGoogleFlow(flow, "wrong-state"), /Invalid Google sign-in state/);
  } finally {
    for (const name of names) {
      const value = previous[name];
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
