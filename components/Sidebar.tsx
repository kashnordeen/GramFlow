"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAllowedNavigationItems,
  getNavigationGroups,
  isRouteActive,
} from "./shell/navigation";
import { MobileNavigation } from "./shell/MobileNavigation";
import { NavigationGlyph } from "./shell/NavigationGlyph";
import styles from "./shell/shell.module.css";

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const groups = useMemo(() => getNavigationGroups(permissions), [permissions]);
  const allowedItems = useMemo(() => getAllowedNavigationItems(permissions), [permissions]);

  useEffect(() => {
    const stored = window.localStorage.getItem("gramflow-sidebar-collapsed");
    setIsCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    window.localStorage.setItem("gramflow-sidebar-collapsed", String(isCollapsed));
    return () => document.body.classList.remove("sidebar-collapsed");
  }, [isCollapsed]);

  return (
    <>
      <aside className={styles.sidebar} aria-label="Primary navigation">
        <div className={styles.brandRow}>
          <Link href="/" className={styles.brand} aria-label="GramFlow dashboard">
            <span className={styles.logo}>
              <Image src="/brand-mark.svg" alt="" width={40} height={40} priority />
            </span>
            <span className={styles.brandCopy}>
              <strong>GramFlow</strong>
              <span>Inventory and receivables</span>
            </span>
          </Link>
          <button
            type="button"
            className={styles.collapseButton}
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((value) => !value)}
          >
            <ChevronLeft
              aria-hidden="true"
              size={18}
              style={{ transform: isCollapsed ? "rotate(180deg)" : undefined }}
            />
          </button>
        </div>

        <nav className={styles.navigation}>
          {groups.map((group) => (
            <section className={styles.group} key={group.label} aria-label={group.label}>
              <p className={styles.groupLabel}>{group.label}</p>
              <div className={styles.groupItems}>
                {group.items.map((item) => {
                  const active = isRouteActive(pathname, item.href);
                  return (
                    <Link
                      href={item.href}
                      key={item.href}
                      className={styles.navLink}
                      aria-current={active ? "page" : undefined}
                      data-tooltip={item.label}
                    >
                      <NavigationGlyph icon={item.icon} />
                      <span className={styles.linkLabel}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className={styles.statusModule} aria-label="FIFO system status">
          <strong>FIFO engine active</strong>
          <span>Batch lineage and audit controls are online.</span>
        </div>
      </aside>

      <MobileNavigation items={allowedItems} pathname={pathname} />
    </>
  );
}
