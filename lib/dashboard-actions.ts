import type { DashboardMetrics, DashboardStockStatus } from "@/types";

export interface DashboardAction {
  actionHref?: string;
  actionLabel?: string;
  consequence: string;
  key: string;
  title: string;
  tone: "critical" | "info" | "neutral" | "warning";
}

interface DashboardActionInput {
  receivableCustomers: number;
  receivableTotal: number;
  setup: DashboardMetrics["setup"];
  stockGrams: number;
  stockStatus: DashboardStockStatus;
}

export function buildDashboardActions(
  input: DashboardActionInput,
  permissions: string[],
): DashboardAction[] {
  const actions: DashboardAction[] = [];
  const can = (permission: string) => permissions.includes(permission);

  if (input.stockStatus === "critical") {
    actions.push({
      key: "stock-critical",
      title: "Inventory is empty",
      consequence: "New sales cannot consume a FIFO batch until stock is added.",
      tone: "critical",
      ...(can("inventory.create") && { actionHref: "/stock", actionLabel: "Add stock" }),
    });
  } else if (input.stockStatus === "warning") {
    actions.push({
      key: "stock-warning",
      title: `${input.stockGrams.toFixed(2)}g remains`,
      consequence: "The next few sales may exhaust available inventory.",
      tone: "warning",
      ...(can("inventory.create") && { actionHref: "/stock", actionLabel: "Replenish" }),
    });
  }

  if (!input.setup.hasCustomers) {
    actions.push({
      key: "setup-customers",
      title: "Customer book is empty",
      consequence: "A customer profile is required before the first sale.",
      tone: "info",
      ...(can("customers.create") && { actionHref: "/customers", actionLabel: "Create customer" }),
    });
  }

  if (input.setup.hasStock && input.setup.hasCustomers && !input.setup.hasSales) {
    actions.push({
      key: "setup-sale",
      title: "Ready for the first sale",
      consequence: "Stock and customers are configured, but no sale is posted yet.",
      tone: "info",
      ...(can("sales.create") && { actionHref: "/add-sale", actionLabel: "Record sale" }),
    });
  }

  if (input.receivableTotal > 0) {
    actions.push({
      key: "receivables",
      title: `${input.receivableCustomers} customer balances need review`,
      consequence: "Outstanding value remains collectible in the customer book.",
      tone: "neutral",
      ...(can("customers.read") && { actionHref: "/customers", actionLabel: "Review balances" }),
    });
  }

  return actions.slice(0, 4);
}
