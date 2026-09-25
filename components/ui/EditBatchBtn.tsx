"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, X, AlertTriangle } from "lucide-react";
import { updateStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { StockBatch } from "@/types";
import { useAccess } from "@/components/AccessProvider";

export function EditBatchBtn({ batch }: { batch: StockBatch }) {
    const { hasPermission } = useAccess();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [grams, setGrams] = useState(batch.grams?.toString() || "");
    const [price, setPrice] = useState(batch.price_per_gram?.toString() || "");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        const fd = new FormData();
        fd.append("grams", grams);
        fd.append("price_per_gram", price);

        const res = await updateStockBatch(batch.id, fd);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Stock batch parameters updated successfully.", "success");
            setIsOpen(false);
        }
        setLoading(false);
    };

    const soldAmount = batch.grams - batch.remaining_grams;

    if (!hasPermission("inventory.update")) return null;
    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Edit Batch Details"
                aria-label={`Edit stock batch ${batch.id}`}
                className="action-icon-btn"
            >
                <Edit2 size={15} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-card animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="edit-batch-title" onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            aria-label="Close batch editor"
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>

                        <h3 id="edit-batch-title" style={{ marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                            <Edit2 size={20} /> Modify Stock Batch
                        </h3>

                        {soldAmount > 0 && (
                            <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(180, 83, 9, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                                <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                    <strong>Notice:</strong> {soldAmount.toFixed(2)}g of this batch has already been sold. You cannot reduce total grams below this consumed amount.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label htmlFor={`batch-total-${batch.id}`}>Total received (g)</label>
                                <input id={`batch-total-${batch.id}`} autoFocus type="number" step="0.01" min={soldAmount > 0 ? soldAmount : 0.01} className="input-field" value={grams} onChange={e => setGrams(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`batch-cost-${batch.id}`}>Cost rate per gram (₹)</label>
                                <input id={`batch-cost-${batch.id}`} type="number" step="0.01" className="input-field" value={price} onChange={e => setPrice(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? "Saving..." : "Apply Updates"}
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
