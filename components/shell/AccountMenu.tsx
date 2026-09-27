"use client";

import Link from "next/link";
import { Database, FileText, LogOut, Plus, Settings, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { logoutAction } from "@/lib/actions/auth.actions";
import { EditProfileBtn } from "@/components/ui/EditProfileBtn";
import styles from "./command.module.css";
import { switchBusiness } from "@/lib/actions/business.actions";
import type { BusinessChoice } from "@/lib/actions/business.actions";

interface AccountMenuProps {
  compact?: boolean;
  businesses: BusinessChoice[];
  user: {
    email: string;
    name: string;
    permissions?: string[];
    roles?: string[];
    has_password?: boolean;
    business_id: number;
    business_name: string;
  };
}

export function AccountMenu({ compact = false, user, businesses }: AccountMenuProps) {
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
            <span>{user.business_name}</span>
            <strong>{user.email}</strong>
            <small>{user.roles?.join(", ") || "No role assigned"}</small>
          </div>
          {businesses.length > 1 && <div className={styles.accountIdentity}>
            <label htmlFor={compact ? "business-mobile" : "business-desktop"}>Switch business</label>
            <select id={compact ? "business-mobile" : "business-desktop"} className="input-field" value={user.business_id} onChange={async (event) => {
              const result = await switchBusiness(Number(event.target.value));
              if (result.error) { window.alert(result.error); return; }
              closeMenu();
              router.push(result.data?.setupComplete ? "/" : "/setup");
              router.refresh();
            }}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select>
          </div>}
          <Link href="/signup" onClick={closeMenu}><Plus aria-hidden="true" size={17} /> Create another business</Link>
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
              Business settings
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
