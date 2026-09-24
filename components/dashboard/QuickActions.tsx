import Link from "next/link";
import { ArrowUpRight, Boxes, ReceiptIndianRupee, UserPlus, UsersRound, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./dashboard.module.css";

interface QuickActionsProps {
  permissions: string[];
}

interface QuickAction {
  href: string;
  icon: LucideIcon;
  label: string;
  permission: string;
}

const quickActions: QuickAction[] = [
  { href: "/add-sale", icon: ReceiptIndianRupee, label: "Record sale", permission: "sales.create" },
  { href: "/stock", icon: Boxes, label: "Add stock", permission: "inventory.create" },
  { href: "/customers", icon: UserPlus, label: "Create customer", permission: "customers.create" },
  { href: "/customers", icon: UsersRound, label: "Open customer book", permission: "customers.read" },
];

export function QuickActions({ permissions }: QuickActionsProps) {
  const visibleActions = quickActions.filter((action) => {
    if (action.permission === "customers.read" && permissions.includes("customers.create")) return false;
    return permissions.includes(action.permission);
  });
  if (visibleActions.length === 0) return null;

  return (
    <section className={styles.quickPanel} aria-labelledby="quick-heading">
      <div>
        <p className={styles.panelKicker}><Zap size={15} /> Direct operations</p>
        <h2 id="quick-heading">Quick actions</h2>
      </div>
      <div className={styles.quickList}>
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link href={action.href} key={`${action.permission}-${action.label}`}>
              <span><Icon size={17} aria-hidden="true" /> {action.label}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
