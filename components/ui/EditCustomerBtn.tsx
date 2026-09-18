"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, X, AlertTriangle } from "lucide-react";
import { updateCustomerLoan } from "@/lib/actions/customer.actions";
import { showToast } from "@/components/ToastProvider";
import { Customer } from "@/types";
import { useAccess } from "@/components/AccessProvider";

export function EditCustomerBtn({ customer }: { customer: Customer }) {
    const { hasPermission } = useAccess();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [loanObj, setLoanObj] = useState(customer.total_loan?.toString() || "0");
    const [oldLoanObj, setOldLoanObj] = useState(customer.old_loan?.toString() || "0");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const floatVal = parseFloat(loanObj);
        const floatOld = parseFloat(oldLoanObj);

        if (isNaN(floatVal) || floatVal < 0 || isNaN(floatOld) || floatOld < 0) {
            showToast("Invalid loan value. Cannot be lower than zero.", "error");
            return;
        }

        if (!confirm(`Warning: You are directly modifying ledger debt.\nLegacy: ₹${floatOld.toFixed(2)}\nApp Debt: ₹${floatVal.toFixed(2)}\nProceed?`)) {
            return;
        }

        setLoading(true);
        const res = await updateCustomerLoan(customer.id, floatOld, floatVal);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Customer loan balance updated successfully.", "success");
            setIsOpen(false);
        }
        setLoading(false);
    };

    if (!hasPermission("customers.update")) return null;
    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Override Loan Parameters"
                className="action-icon-btn"
            >
                <Edit2 size={15} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>

                        <h3 style={{ marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                            <Edit2 size={20} /> Force-Override Loan
                        </h3>

                        <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(180, 83, 9, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                            <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                <strong>Notice:</strong> This directly overwrites the ledger without creating a payment receipt.
                            </p>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Legacy Debt (₹)</label>
                                <input type="number" step="0.01" min="0" className="input-field" value={oldLoanObj} onChange={e => setOldLoanObj(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label>App Debt (₹)</label>
                                <input type="number" step="0.01" min="0" className="input-field" value={loanObj} onChange={e => setLoanObj(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
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
