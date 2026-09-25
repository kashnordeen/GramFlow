"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, CircleGauge, ShoppingCart } from "lucide-react";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette } from "@/components/shell/CommandPalette";
import {
  getAllowedNavigationItems,
  isRouteActive,
} from "@/components/shell/navigation";
import styles from "@/components/shell/command.module.css";

interface TopNavUser {
  email: string;
  name: string;
  permissions?: string[];
  roles?: string[];
  has_password?: boolean;
}

export function TopNav({ user }: { user: TopNavUser }) {
  const pathname = usePathname();
  const permissions = user.permissions || [];
  const navigationItems = getAllowedNavigationItems(permissions);
  const current = navigationItems.find((item) => isRouteActive(pathname, item.href));
  const currentLabel = current?.label || "Workspace";
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date());

  return (
    <>
      <header className={styles.commandBar}>
        <div className={styles.pageContext}>
          <span className={styles.contextIcon}>
            <CircleGauge aria-hidden="true" size={19} strokeWidth={1.9} />
          </span>
          <span>
            <strong>{currentLabel}</strong>
            <span>
              Live workspace · <time suppressHydrationWarning>{dateLabel}</time>
            </span>
          </span>
        </div>

        <CommandPalette items={navigationItems} />

        <div className={styles.actions}>
          <ThemeToggle compact />
          {permissions.includes("inventory.create") && (
            <Link href="/stock" className={styles.actionLink} aria-label="Add stock">
              <Boxes aria-hidden="true" size={17} />
              <span>Add stock</span>
            </Link>
          )}
          {permissions.includes("sales.create") && (
            <Link href="/add-sale" className={styles.primaryAction} aria-label="Record sale">
              <ShoppingCart aria-hidden="true" size={17} />
              <span>Record sale</span>
            </Link>
          )}
          <AccountMenu user={user} />
        </div>
      </header>

      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand}>
          <Image src="/brand-mark.svg" alt="" width={36} height={36} priority />
          <span>
            <strong>GramFlow</strong>
            <span>{currentLabel}</span>
          </span>
        </Link>
        <div className={styles.actions}><ThemeToggle compact /><AccountMenu user={user} compact /></div>
      </header>
    </>
  );
}
