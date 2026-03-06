"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PowerOff } from "lucide-react";
import { closeStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";

export function CloseBatchBtn({ id }: { id: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = async () => {
        setSubmitting(true);
        const res = await closeStockBatch(id);
        setSubmitting(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Batch forcefully exhausted.", "success");
            setIsOpen(false);
        }
    };

    return (
        <>
            <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => setIsOpen(true)} title="Force End Batch">
                <PowerOff size={16} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in" style={{ padding: '2rem', maxWidth: '400px', width: '90%' }}>
                        <h3 className="text-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                            <PowerOff size={24} /> Force End Batch
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Are you sure you want to prematurely end this batch? This discards its remaining inventory and forces the FIFO system to advance.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsOpen(false)} disabled={submitting}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, background: 'var(--error)', color: 'white', borderColor: 'var(--error)' }} onClick={handleClose} disabled={submitting}>
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
