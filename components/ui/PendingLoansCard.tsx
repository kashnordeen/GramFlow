"use client";

import { Users, X, ArrowUpRight } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import { PrivacyToggleButton } from "@/components/ui/PrivacyToggleButton";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Customer } from "@/types";

interface PendingLoansCardProps {
    totalLoan: number;
    customers: Customer[];
}

export function PendingLoansCard({ totalLoan, customers }: PendingLoansCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div
                className="card-light bg-halftone"
                style={{
                    height: '100%',
                    minHeight: '190px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                onClick={() => setIsOpen(true)}
            >
                <div>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span className="kpi-label">
                            <Users size={16} style={{ color: 'var(--text-primary)' }} /> Pending Loans
                        </span>
                        <PrivacyToggleButton />
                    </div>
                    <div className="kpi-value">
                        <span style={{ fontSize: '1.4rem', marginRight: '2px', color: 'var(--text-muted)' }}>₹</span>
                        <PrivacyMask>
                            <AnimatedCounter value={totalLoan} />
                        </PrivacyMask>
                    </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                    <button
                        type="button"
                        style={{
                            background: 'var(--bg-dark)',
                            color: 'var(--accent)',
                            border: 'none',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        <span>View {customers?.length || 0} active debts</span>
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div
                        className="modal-card animate-fade-in"
                        style={{ maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'var(--bg-subtle)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                    <Users size={18} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Active Outstandings</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Total Ledger: <strong style={{ color: 'var(--text-primary)' }}>
                                    <PrivacyMask>₹{totalLoan.toFixed(2)}</PrivacyMask>
                                </strong> across {customers.length} individuals
                            </p>
                        </div>

                        <div style={{ overflowY: 'auto', paddingRight: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                            {customers.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>No active loans found.</p>
                            ) : (
                                customers.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex-between"
                                        style={{
                                            background: 'var(--bg-subtle)',
                                            padding: '0.85rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-subtle)'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.15rem 0', fontSize: '0.95rem' }}>{c.name}</p>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{c.phone || 'No phone recorded'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="badge-status loan" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                                                <PrivacyMask>₹{((c.total_loan || 0) + (c.old_loan || 0)).toFixed(2)}</PrivacyMask>
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
