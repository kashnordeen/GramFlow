"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { PowerOff } from "lucide-react";
import { closeStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { useAccess } from "@/components/AccessProvider";

export function CloseBatchBtn({ id }: { id: number }) {
    const { hasPermission } = useAccess();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = async () => {
        setSubmitting(true);
        const res = await closeStockBatch(id);
        setSubmitting(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Batch finalized and marked as depleted.", "success");
            setIsOpen(false);
        }
    };

    if (!hasPermission("inventory.update")) return null;
    return (
        <>
            <button
                type="button"
                className="action-icon-btn danger"
                onClick={() => setIsOpen(true)}
                title="Force End Batch"
            >
                <PowerOff size={15} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-card animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="close-batch-title" style={{ maxWidth: '420px' }} onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }} onClick={(e) => e.stopPropagation()}>
                        <h3 id="close-batch-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, color: 'var(--danger)', fontSize: '1.25rem' }}>
                            <PowerOff size={20} /> Force End Batch
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.5rem' }}>
                            Are you sure you want to prematurely end this batch? This discards its remaining inventory and forces the FIFO system to advance.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsOpen(false)} disabled={submitting}>
                                Cancel
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1, background: 'var(--danger)', color: '#FFFFFF' }}
                                onClick={handleClose}
                                disabled={submitting}
                            >
                                {submitting ? "Processing..." : "End Batch"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
