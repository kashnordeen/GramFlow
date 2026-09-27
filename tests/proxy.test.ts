import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { proxy } from "../proxy";

test("legacy cookies without a business redirect to login instead of looping", async () => {
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
  try {
    const token = await new SignJWT({ sub: "1", sv: 1 }).setProtectedHeader({ alg: "HS256" })
      .setIssuer("gramflow").setAudience("gramflow-web").sign(new TextEncoder().encode(process.env.JWT_SECRET));
    const request = (path: string) => new NextRequest(`https://example.com${path}`, { headers: { cookie: `gramflow_auth=${token}` } });
    assert.equal((await proxy(request("/"))).headers.get("location"), "https://example.com/login");
    assert.equal((await proxy(request("/login"))).headers.get("location"), null);
  } finally {
    if (original === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = original;
  }
});
