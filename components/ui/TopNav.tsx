"use client";

import { useState, useRef, useEffect } from "react";
import {
    ChevronDown,
    Database,
    FileText,
    LogOut,
    UserCircle,
    Settings
} from "lucide-react";
import { EditProfileBtn } from "./EditProfileBtn";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth.actions";
import Link from "next/link";

export function TopNav({ user }: { user: { name: string, email: string, roles?: string[], permissions?: string[] } }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileDropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const clickedInsideDesktop = dropdownRef.current && dropdownRef.current.contains(target);
            const clickedInsideMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);

            if (!clickedInsideDesktop && !clickedInsideMobile) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "A";

    const renderDropdownMenu = () => (
        <div
            style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '230px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 60,
                animation: 'modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
        >
            <div style={{ padding: '0.65rem', marginBottom: '0.4rem', borderBottom: '1px solid var(--bg-subtle)' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</p>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.roles?.join(', ') || 'No role assigned'}</p>
            </div>

            <button
                onClick={() => {
                    setDropdownOpen(false);
                    setModalOpen(true);
                }}
                style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <UserCircle size={16} /> Edit Profile
            </button>

            {user.permissions?.includes("settings.manage") && <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textDecoration: 'none',
                    transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <Settings size={16} /> Global Settings
            </Link>}

            {user.permissions?.includes("reports.read") && <a
                href="/api/export-ledger"
                target="_blank"
                onClick={() => setDropdownOpen(false)}
                style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textDecoration: 'none',
                    transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <FileText size={16} /> Export Ledger Report
            </a>}

            {user.permissions?.includes("roles.manage") && <a
                href="/api/backup"
                download
                onClick={() => setDropdownOpen(false)}
                style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textDecoration: 'none',
                    transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <Database size={16} /> Download Data Export
            </a>}

            <div style={{ margin: '0.4rem 0', height: '1px', background: 'var(--bg-subtle)' }} />

            <button
                onClick={async (e) => {
                    e.preventDefault();
                    setIsLoggingOut(true);
                    setDropdownOpen(false);
                    await logoutAction();
                    router.push('/login');
                }}
                disabled={isLoggingOut}
                style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <LogOut size={16} /> {isLoggingOut ? "Logging out..." : "Log Out"}
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop Top Utility Bar */}
            <header className="top-utility-bar">
                <div />
                <div className="top-utility-actions">
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="profile-pill-btn"
                        >
                            <div className="profile-avatar-circle">
                                {userInitial}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                {user.name}
                            </span>
                            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                        </button>

                        {dropdownOpen && renderDropdownMenu()}
                    </div>
                </div>
            </header>

            {/* Mobile Top Header (< 768px) */}
            <header className="mobile-top-header">
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src="/logo.png" alt="GramFlow" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>GramFlow</h2>
                    </div>
                </Link>

                <div ref={mobileDropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="profile-pill-btn"
                        style={{ padding: '0.3rem 0.65rem 0.3rem 0.35rem' }}
                    >
                        <div className="profile-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.78rem' }}>
                            {userInitial}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.name}
                        </span>
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>

                    {dropdownOpen && renderDropdownMenu()}
                </div>
            </header>

            <EditProfileBtn
                isOpen={modalOpen}
                setIsOpen={setModalOpen}
                currentEmail={user.email}
                currentName={user.name}
            />
        </>
    );
}
