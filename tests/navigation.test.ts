import test from "node:test";
import assert from "node:assert/strict";
import {
  getNavigationGroups,
  isRouteActive,
} from "../components/shell/navigation";

test("navigation exposes only destinations allowed by persisted permissions", () => {
  const groups = getNavigationGroups(["sales.read", "customers.read"]);
  const destinations = groups.flatMap((group) => group.items.map((item) => item.href));

  assert.deepEqual(destinations, ["/", "/transactions", "/customers"]);
});

test("navigation keeps operational, control, and system destinations grouped", () => {
  const groups = getNavigationGroups([
    "sales.create",
    "sales.read",
    "customers.read",
    "inventory.read",
    "accounting.read",
    "audit.read",
    "settings.manage",
    "roles.read",
  ]);

  assert.deepEqual(
    groups.map((group) => ({
      label: group.label,
      items: group.items.map((item) => item.label),
    })),
    [
      {
        label: "Operate",
        items: ["Dashboard", "Record sale", "Transactions", "Customers", "Stock vault"],
      },
      { label: "Control", items: ["Accounting", "Audit log"] },
      { label: "System", items: ["Settings", "Access control"] },
    ],
  );
});

test("active routes match nested destinations without matching unrelated prefixes", () => {
  assert.equal(isRouteActive("/", "/"), true);
  assert.equal(isRouteActive("/customers/42", "/customers"), true);
  assert.equal(isRouteActive("/customer-support", "/customers"), false);
  assert.equal(isRouteActive("/transactions", "/"), false);
});
