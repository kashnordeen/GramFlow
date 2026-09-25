"use client";

import Link from "next/link";
import { Database, FileText, LogOut, Settings, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { logoutAction } from "@/lib/actions/auth.actions";
import { EditProfileBtn } from "@/components/ui/EditProfileBtn";
import styles from "./command.module.css";

interface AccountMenuProps {
  compact?: boolean;
  user: {
    email: string;
    name: string;
    permissions?: string[];
    roles?: string[];
    has_password?: boolean;
  };
}

export function AccountMenu({ compact = false, user }: AccountMenuProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const router = useRouter();
  const initial = user.name?.charAt(0).toLocaleUpperCase() || "A";

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
  }

  async function logOut() {
    setIsLoggingOut(true);
    closeMenu();
    await logoutAction();
    router.push("/login");
  }

  return (
    <>
      <details className={styles.account} ref={detailsRef}>
        <summary aria-label="Open account menu">
          <span className={styles.avatar}>{initial}</span>
          {!compact && <span className={styles.accountName}>{user.name}</span>}
        </summary>
        <div className={styles.accountMenu}>
          <div className={styles.accountIdentity}>
            <span>Signed in as</span>
            <strong>{user.email}</strong>
            <small>{user.roles?.join(", ") || "No role assigned"}</small>
          </div>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setModalOpen(true);
            }}
          >
            <UserCircle aria-hidden="true" size={17} />
            Edit profile
          </button>
          {user.permissions?.includes("settings.manage") && (
            <Link href="/settings" onClick={closeMenu}>
              <Settings aria-hidden="true" size={17} />
              Global settings
            </Link>
          )}
          {user.permissions?.includes("reports.read") && (
            <a href="/api/export-ledger" target="_blank" rel="noreferrer" onClick={closeMenu}>
              <FileText aria-hidden="true" size={17} />
              Export ledger
            </a>
          )}
          {user.permissions?.includes("roles.manage") && (
            <a href="/api/backup" download onClick={closeMenu}>
              <Database aria-hidden="true" size={17} />
              Download export
            </a>
          )}
          <button type="button" className={styles.logout} onClick={logOut} disabled={isLoggingOut}>
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? "Signing out" : "Sign out"}
          </button>
        </div>
      </details>

      <EditProfileBtn
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        currentEmail={user.email}
        currentName={user.name}
        hasPassword={user.has_password !== false}
      />
    </>
  );
}
