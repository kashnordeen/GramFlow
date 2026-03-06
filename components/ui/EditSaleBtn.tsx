"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, X } from "lucide-react";
import { updateSale } from "@/lib/actions/sale.actions";
import { showToast } from "@/components/ToastProvider";

export function EditSaleBtn({ sale }: { sale: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Local form state
    const [grams, setGrams] = useState(sale.grams_sold?.toString() || "");
    const [discount, setDiscount] = useState(sale.discount?.toString() || "0");
    const [received, setReceived] = useState(sale.amount_received?.toString() || "0");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (parseFloat(grams) !== sale.grams_sold) {
            if (!confirm("CRITICAL WARNING:\n\nChanging the physical grams sold will permanently destroy this sale's exact historical FIFO batch linkages and automatically generate a new sale sequence to re-calculate current remaining inventory.\n\nAre you sure you want to proceed?")) {
                return;
            }
        }

        setLoading(true);
        const fd = new FormData();
        fd.append("grams_sold", grams);
        fd.append("discount", discount);
        fd.append("amount_received", received);

        const res = await updateSale(sale.id, fd);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Sale entry successfully modified and ledger balances updated.", "success");
            setIsOpen(false);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Edit Sale Details"
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
                    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative', textAlign: 'left' }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Edit2 className="text-accent" /> Modify Sale Entry
                        </h3>

                        <form onSubmit={handleSave}>
                            <div className="form-group mb-2">
                                <label>Grams Sold (g)</label>
                                <input type="number" step="0.01" className="input-field" value={grams} onChange={e => setGrams(e.target.value)} required />
                                <p style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Changing this physically alters historical stock linkages.</p>
                            </div>
                            <div className="form-group mb-2">
                                <label>Discount Applied (₹)</label>
                                <input type="number" step="0.01" className="input-field" value={discount} onChange={e => setDiscount(e.target.value)} required />
                            </div>
                            <div className="form-group mb-2">
                                <label>Amount Received (₹)</label>
                                <input type="number" step="0.01" className="input-field" value={received} onChange={e => setReceived(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Cancel</button>
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
