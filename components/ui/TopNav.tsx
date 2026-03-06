"use client";

import { useState, useRef, useEffect } from "react";
import { UserCircle, ChevronDown, Database, FileText, LogOut } from "lucide-react";
import { EditProfileBtn } from "./EditProfileBtn";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth.actions";

export function TopNav({ user }: { user: { name: string, email: string } }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="topnav-container" style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 40
        }}>

            {/* Profile Dropdown Component */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 'var(--radius-full)',
                        padding: '0.5rem 1rem 0.5rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
                >
                    <div style={{
                        background: 'rgba(227, 255, 55, 0.1)',
                        padding: '0.4rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <UserCircle size={20} className="text-accent" />
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {user.name}
                    </span>
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                    <div className="glass-panel animate-fade-in" style={{
                        position: 'absolute',
                        top: '110%',
                        right: 0,
                        width: '200px',
                        padding: '0.5rem',
                        overflow: 'hidden',
                        zIndex: 50
                    }}>
                        <div style={{ padding: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--card-border)' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                setDropdownOpen(false);
                                setModalOpen(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'left',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'var(--transition)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            Edit Profile
                        </button>

                        <a
                            href="/api/export-ledger"
                            target="_blank"
                            onClick={() => setDropdownOpen(false)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'left',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'var(--transition)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textDecoration: 'none',
                                marginTop: '0.25rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <FileText size={16} /> Download PDF Report
                        </a>

                        <div style={{ margin: '0.5rem 0', height: '1px', background: 'var(--card-border)' }} />

                        <a
                            href="/api/backup"
                            download
                            onClick={() => setDropdownOpen(false)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'left',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'var(--transition)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textDecoration: 'none'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Database size={16} /> Backup Database File
                        </a>
                        <div style={{ margin: '0.5rem 0', height: '1px', background: 'var(--card-border)' }} />

                        <button
                            className={`${isLoggingOut ? 'ashing-out' : ''}`}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'left',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'var(--transition)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={(e) => {
                                e.preventDefault();
                                setIsLoggingOut(true);
                                setDropdownOpen(false);
                                setTimeout(async () => {
                                    await logoutAction();
                                    router.push('/login');
                                }, 1500); // Wait for the Ash-Out animation
                            }}
                            disabled={isLoggingOut}
                        >
                            <LogOut size={16} /> Log Out
                        </button>
                    </div>
                )}
            </div>

            <EditProfileBtn
                isOpen={modalOpen}
                setIsOpen={setModalOpen}
                currentEmail={user.email}
                currentName={user.name}
            />
        </div>
    );
}
