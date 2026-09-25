"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, X } from "lucide-react";
import { updateSale } from "@/lib/actions/sale.actions";
import { showToast } from "@/components/ToastProvider";
import { Sale } from "@/types";
import { useAccess } from "@/components/AccessProvider";

export function EditSaleBtn({ sale }: { sale: Sale }) {
    const { hasPermission } = useAccess();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Local form state
    const [discount, setDiscount] = useState(sale.discount?.toString() || "0");
    const [received, setReceived] = useState(sale.amount_received?.toString() || "0");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        const fd = new FormData();
        fd.append("discount", discount);
        fd.append("amount_received", received);

        const res = await updateSale(sale.id, fd);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Sale entry successfully updated.", "success");
            setIsOpen(false);
        }
        setLoading(false);
    };

    if (!hasPermission("sales.create")) return null;
    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Edit Sale Details"
                aria-label={`Edit sale ${sale.id}`}
                className="action-icon-btn"
            >
                <Edit2 size={15} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-card animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="edit-sale-title" onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            aria-label="Close sale editor"
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>

                        <h3 id="edit-sale-title" style={{ marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                            <Edit2 size={20} /> Edit sale
                        </h3>

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label htmlFor={`sale-weight-${sale.id}`}>Weight sold (g)</label>
                                <input
                                    id={`sale-weight-${sale.id}`}
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={sale.grams_sold}
                                    disabled
                                    style={{ opacity: 0.65, cursor: 'not-allowed', background: 'var(--bg-subtle)' }}
                                />
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Weight is locked to preserve FIFO lineage. Delete and re-record to modify grams.
                                </p>
                            </div>
                            <div className="form-group">
                                <label htmlFor={`sale-discount-${sale.id}`}>Discount (₹)</label>
                                <input id={`sale-discount-${sale.id}`} autoFocus type="number" step="0.01" className="input-field" value={discount} onChange={e => setDiscount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`sale-received-${sale.id}`}>Amount received (₹)</label>
                                <input id={`sale-received-${sale.id}`} type="number" step="0.01" className="input-field" value={received} onChange={e => setReceived(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? "Saving..." : "Apply Changes"}
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
