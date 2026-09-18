import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../lib/html";
import { isEmailAllowed, validatePassword } from "../lib/auth/policy";

test("HTML export values are escaped", () => {
  assert.equal(escapeHtml(`<script>alert("x")</script>&`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;");
});

test("email policy uses the configured exact domain", () => {
  const previous = process.env.ALLOWED_EMAIL_DOMAIN;
  process.env.ALLOWED_EMAIL_DOMAIN = "example.com";
  assert.equal(isEmailAllowed("USER@example.com"), true);
  assert.equal(isEmailAllowed("user@evil-example.com"), false);
  if (previous === undefined) delete process.env.ALLOWED_EMAIL_DOMAIN; else process.env.ALLOWED_EMAIL_DOMAIN = previous;
});

test("password policy rejects weak passwords", () => {
  assert.match(validatePassword("alllowercase1") || "", /uppercase/);
  assert.equal(validatePassword("StrongDemo123"), null);
});
