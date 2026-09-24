import Link from "next/link";
import {
  ArrowRight,
  Check,
  PackagePlus,
  ShoppingBag,
  UserPlus,
  Vault,
} from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Surface } from "@/components/ui/Surface";
import styles from "./dashboard.module.css";

interface DashboardEmptyStateProps {
  permissions: string[];
  setup: DashboardMetrics["setup"];
}

const setupSteps = [
  {
    description: "Open a FIFO batch so GramFlow can value every future sale.",
    href: "/stock",
    icon: PackagePlus,
    label: "Add opening stock",
    permission: "inventory.create",
    setupKey: "hasStock" as const,
  },
  {
    description: "Create the customer book used for sales and balances.",
    href: "/customers",
    icon: UserPlus,
    label: "Create a customer",
    permission: "customers.create",
    setupKey: "hasCustomers" as const,
  },
  {
    description: "Record the first sale once stock and a customer are ready.",
    href: "/add-sale",
    icon: ShoppingBag,
    label: "Record a sale",
    permission: "sales.create",
    setupKey: "hasSales" as const,
  },
];

export function DashboardEmptyState({
  permissions,
  setup,
}: DashboardEmptyStateProps) {
  return (
    <Surface as="section" className={styles.emptyState} tone="feature">
      <div className={styles.emptySignal} aria-hidden="true">
        <Vault size={30} strokeWidth={1.6} />
      </div>
      <div className={styles.emptyCopy}>
        <StatusBadge tone="info">First run</StatusBadge>
        <h2>Build your operating loop</h2>
        <p>
          Three short steps turn this command center on. Complete them in order
          so FIFO costing and customer balances begin accurately.
        </p>
      </div>
      <ol className={styles.setupSteps}>
        {setupSteps.map((step, index) => {
          const Icon = step.icon;
          const complete = setup[step.setupKey];
          const allowed = permissions.includes(step.permission);

          return (
            <li className={styles.setupStep} key={step.label}>
              <span className={styles.stepNumber} aria-hidden="true">
                {complete ? <Check size={16} /> : index + 1}
              </span>
              <Icon className={styles.stepIcon} size={22} aria-hidden="true" />
              <div>
                <h3>{step.label}</h3>
                <p>{step.description}</p>
              </div>
              {complete ? (
                <StatusBadge tone="healthy">Complete</StatusBadge>
              ) : allowed ? (
                <Link className={styles.inlineAction} href={step.href}>
                  Start <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ) : (
                <span className={styles.permissionNote}>Ask an administrator</span>
              )}
            </li>
          );
        })}
      </ol>
    </Surface>
  );
}
