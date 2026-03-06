"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, X, AlertTriangle } from "lucide-react";
import { updateStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";

export function EditBatchBtn({ batch }: { batch: any }) {
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
            showToast("Stock batch parameters successfully updated.", "success");
            setIsOpen(false);
        }
        setLoading(false);
    };

    const soldAmount = batch.grams - batch.remaining_grams;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Edit Batch Details"
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
                            <Edit2 className="text-accent" /> Modify Stock Batch
                        </h3>

                        {soldAmount > 0 && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <AlertTriangle size={18} className="text-error" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                                    <strong>Caution:</strong> {soldAmount.toFixed(2)}g of this batch has already been fulfilled to customers. You cannot reduce total grams below this consumed amount!
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div className="form-group mb-2">
                                <label>Total Ingested Grams</label>
                                <input type="number" step="0.01" min={soldAmount > 0 ? soldAmount : 0.01} className="input-field" value={grams} onChange={e => setGrams(e.target.value)} required />
                            </div>
                            <div className="form-group mb-2">
                                <label>Cost Rate (per gram)</label>
                                <input type="number" step="0.01" className="input-field" value={price} onChange={e => setPrice(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Cancel</button>
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
