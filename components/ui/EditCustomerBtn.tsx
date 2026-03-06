"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, X, AlertTriangle } from "lucide-react";
import { updateCustomerLoan } from "@/lib/actions/customer.actions";
import { showToast } from "@/components/ToastProvider";

export function EditCustomerBtn({ customer }: { customer: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [loanObj, setLoanObj] = useState(customer.total_loan?.toString() || "0");
    const [oldLoanObj, setOldLoanObj] = useState(customer.old_loan?.toString() || "0");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const floatVal = parseFloat(loanObj);
        const floatOld = parseFloat(oldLoanObj);

        if (isNaN(floatVal) || floatVal < 0 || isNaN(floatOld) || floatOld < 0) {
            showToast("Invalid loan structure. Value cannot be lower than zero.", "error");
            return;
        }

        if (!confirm(`Warning: You are forcing balances without payment reference.\nLegacy: ₹${floatOld.toFixed(2)}\nApp Debt: ₹${floatVal.toFixed(2)}\nProceed?`)) {
            return;
        }

        setLoading(true);

        const res = await updateCustomerLoan(customer.id, floatOld, floatVal);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Outstanding Customer Loan directly overridden successfully.", "success");
            setIsOpen(false);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Override Loan Parameters"
                style={{
                    background: 'rgba(234, 179, 8, 0.15)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    padding: '0.4rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    marginRight: '0.4rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(234, 179, 8, 0.3)' }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(234, 179, 8, 0.15)' }}
            >
                <Edit2 size={16} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay">
                    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', textAlign: 'left' }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Edit2 className="text-accent" /> Force-Override Loan
                        </h3>

                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <AlertTriangle size={18} className="text-error" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                                <strong>Caution:</strong> This process forcefully overwrites the ledger without validating an incoming payment receipt. It will immediately mask or explode current standing loan debts.
                            </p>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group mb-2">
                                <label>Legacy Debt (₹)</label>
                                <input type="number" step="0.01" min="0" className="input-field" value={oldLoanObj} onChange={e => setOldLoanObj(e.target.value)} required />
                            </div>

                            <div className="form-group mb-2">
                                <label>App Debt (₹)</label>
                                <input type="number" step="0.01" min="0" className="input-field" value={loanObj} onChange={e => setLoanObj(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? "Patching..." : "Execute Override"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
