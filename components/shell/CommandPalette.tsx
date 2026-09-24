"use client";

import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  filterNavigationItems,
  type NavigationItem,
} from "./navigation";
import { NavigationGlyph } from "./NavigationGlyph";
import styles from "./command.module.css";

export function CommandPalette({ items }: { items: NavigationItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const filteredItems = filterNavigationItems(items, query);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        dialogRef.current?.showModal();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function close() {
    dialogRef.current?.close();
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        className={styles.commandTrigger}
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Search destinations and actions"
      >
        <Search aria-hidden="true" size={17} />
        <span>Search destinations</span>
        <kbd>Ctrl K</kbd>
      </button>

      <dialog
        className={styles.palette}
        ref={dialogRef}
        aria-labelledby="command-palette-title"
        onClose={() => setQuery("")}
      >
        <div className={styles.paletteHeader}>
          <Search aria-hidden="true" size={19} />
          <label className={styles.visuallyHidden} htmlFor="command-search">
            Search destinations
          </label>
          <input
            id="command-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Where do you want to go?"
            autoComplete="off"
            autoFocus
          />
          <button type="button" aria-label="Close command palette" onClick={close}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className={styles.paletteBody}>
          <p id="command-palette-title" className={styles.paletteLabel}>
            Available destinations
          </p>
          {filteredItems.length > 0 ? (
            <div className={styles.commandList}>
              {filteredItems.map((item) => (
                <Link href={item.href} key={item.href} onClick={close}>
                  <span className={styles.commandIcon}>
                    <NavigationGlyph icon={item.icon} />
                  </span>
                  <span>{item.label}</span>
                  <ArrowUpRight aria-hidden="true" size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No authorized destination matches that search.</p>
          )}
        </div>
      </dialog>
    </>
  );
}
