"use client";

import { Users, X } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import { PrivacyToggleButton } from "@/components/ui/PrivacyToggleButton";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomerWithLoan {
    id: number;
    name: string;
    total_loan: number;
    old_loan: number;
    phone: string | null;
}

interface PendingLoansCardProps {
    totalLoan: number;
    customers: CustomerWithLoan[];
}

export function PendingLoansCard({ totalLoan, customers }: PendingLoansCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div
                className="glass-card"
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => setIsOpen(true)}
            >
                {/* Hover Glow Effect Indicator */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)', transition: 'var(--transition)', boxShadow: 'inset 0 0 0 1px transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(227, 255, 55, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'inset 0 0 0 1px transparent'}
                />

                <div className="flex-between" style={{ marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                    <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Pending Loans <PrivacyToggleButton />
                    </span>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '10px' }}>
                        <Users size={22} className="text-accent" />
                    </div>
                </div>
                <div className="metric-value" style={{ position: 'relative', zIndex: 2 }}>
                    <span className="metric-currency">₹</span>
                    <PrivacyMask>
                        <AnimatedCounter value={totalLoan} />
                    </PrivacyMask>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent)', margin: 0, opacity: 0.8, marginTop: '0.2rem', position: 'relative', zIndex: 2 }}>
                    Click to view {customers?.length || 0} active debts
                </p>
            </div>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="success-overlay" style={{ alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem', animation: 'successPop 0.3s ease forwards', position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={24} className="text-accent" /> Active Outstandings
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Total Ledger: <strong className="text-accent">
                                    <PrivacyMask>₹{totalLoan.toFixed(2)}</PrivacyMask>
                                </strong> across {customers.length} individuals
                            </p>
                        </div>

                        <div style={{ overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                            {customers.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>No active loans found.</p>
                            ) : (
                                customers.map((c) => (
                                    <div key={c.id} className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem 0', fontSize: '1.05rem' }}>{c.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{c.phone || 'No phone recorded'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
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
