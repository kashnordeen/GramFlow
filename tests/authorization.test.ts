import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../lib/auth/authorization";

const user = { id: 1, email: "admin@hemp.com", name: "Admin", business_id: 1, business_name: "Test", business_slug: "test-1", setup_complete: true, roles: ["MANAGER"], permissions: ["sales.read", "sales.create"], has_password: true };

test("RBAC grants only persisted permissions", () => {
  assert.equal(hasPermission(user, "sales.create"), true);
  assert.equal(hasPermission(user, "roles.manage"), false);
  assert.equal(hasPermission(null, "sales.read"), false);
});
