"use client";

import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";
import { useRef } from "react";
import type { NavigationItem } from "./navigation";
import { isRouteActive } from "./navigation";
import { NavigationGlyph } from "./NavigationGlyph";
import styles from "./shell.module.css";

const fixedDestinations = ["/", "/transactions", "/customers"];

export function MobileNavigation({
  items,
  pathname,
}: {
  items: NavigationItem[];
  pathname: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canRecordSale = items.some((item) => item.href === "/add-sale");
  const fixedItems = items.filter((item) => fixedDestinations.includes(item.href));
  const moreItems = items.filter(
    (item) => !fixedDestinations.includes(item.href) && item.href !== "/add-sale",
  );

  function renderItem(item: NavigationItem) {
    return (
      <Link
        href={item.href}
        className={styles.mobileItem}
        aria-current={isRouteActive(pathname, item.href) ? "page" : undefined}
        key={item.href}
      >
        <NavigationGlyph icon={item.icon} size={21} />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        {fixedItems.slice(0, 2).map(renderItem)}
        {canRecordSale ? (
          <Link
            href="/add-sale"
            className={`${styles.mobileItem} ${styles.primaryMobileAction}`}
            aria-label="Record sale"
          >
            <Plus aria-hidden="true" size={24} strokeWidth={2.4} />
            <span>Record sale</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {fixedItems.slice(2, 3).map(renderItem)}
        <button
          type="button"
          className={`${styles.mobileItem} ${styles.moreButton}`}
          aria-label="More destinations"
          onClick={() => dialogRef.current?.showModal()}
        >
          <Menu aria-hidden="true" size={21} strokeWidth={1.9} />
          <span>More</span>
        </button>
      </nav>

      <dialog className={styles.moreDialog} ref={dialogRef} aria-labelledby="more-navigation-title">
        <div className={styles.sheetHeader}>
          <h2 id="more-navigation-title">More destinations</h2>
          <button
            type="button"
            className={styles.collapseButton}
            aria-label="Close more destinations"
            onClick={() => dialogRef.current?.close()}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className={styles.sheetLinks}>
          {moreItems.map((item) => (
            <Link
              href={item.href}
              className={styles.sheetLink}
              key={item.href}
              onClick={() => dialogRef.current?.close()}
            >
              <NavigationGlyph icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </dialog>
    </>
  );
}
