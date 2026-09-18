"use client";

import { useState, useEffect } from "react";
import { getStockBatches, getTotalStock, addStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { Layers, PackagePlus } from "lucide-react";
import { DeleteBatchBtn } from "@/components/ui/DeleteBatchBtn";
import { EditBatchBtn } from "@/components/ui/EditBatchBtn";
import { CloseBatchBtn } from "@/components/ui/CloseBatchBtn";
import { StockBatch } from "@/types";
import { useAccess } from "@/components/AccessProvider";

export default function StockPage() {
    const { hasPermission } = useAccess();
    const [batches, setBatches] = useState<StockBatch[]>([]);
    const [totalStock, setTotalStock] = useState(0);
    const [loading, setLoading] = useState(true);

    // Add Batch Form
    const [grams, setGrams] = useState("");
    const [adding, setAdding] = useState(false);

    async function loadData() {
        try {
            const [batchesRes, totalRes] = await Promise.all([getStockBatches(), getTotalStock()]);
            setBatches(Array.isArray(batchesRes) ? batchesRes : []);
            setTotalStock(typeof totalRes === 'number' ? totalRes : 0);
        } catch {
            showToast("Failed to fetch stock data", "error");
        }
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleAddBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);

        const fd = new FormData();
        fd.append("grams", grams);

        const res = await addStockBatch(fd);
        setAdding(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Stock batch recorded! FIFO mechanism updated.", "success");
            setGrams("");
            loadData();
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading stock vault...</div>
        </div>
    );

    return (
        <>
            <div className="flex-between" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1>Stock Vault</h1>
                    <p>Ingest incoming inventory batches. Strict automated FIFO fulfillment ensures earliest batches clear first.</p>
                </div>
                <div className="card-dark" style={{ padding: '1rem 1.75rem', minWidth: '220px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Available Stock</p>
                        <div style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                            {totalStock.toFixed(2)}<span style={{ fontSize: '1.1rem', fontWeight: 500 }}>g</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'start' }}>
                {/* Ingest Batch Card */}
                {hasPermission("inventory.create") && <div className="card-light" style={{ padding: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.2rem' }}>
                        <PackagePlus size={20} /> Ingest New Batch
                    </h3>
                    <form onSubmit={handleAddBatch}>
                        <div className="form-group">
                            <label>Initial Gram Weight <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="input-field"
                                value={grams}
                                onChange={e => setGrams(e.target.value)}
                                required
                                placeholder="e.g. 10.50"
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Cost price per gram is read from the secured server environment at ingestion time.
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={adding}>
                            {adding ? "Writing to ledger..." : "Confirm Batch Ingestion"}
                        </button>
                    </form>
                </div>}

                {/* FIFO Explanation Card */}
                <div className="card-light bg-halftone" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '220px' }}>
                    <Layers size={40} style={{ opacity: 0.35, marginBottom: '1rem', color: 'var(--text-primary)' }} />
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 600 }}>FIFO Principle Enforced</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.5 }}>
                        Sales automatically deduct weight from the oldest available batch. When a batch hits 0.00g, it is finalized.
                    </p>
                </div>
            </div>

            <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>Historical Batches Master-list</h2>
            <div className="table-luxury-container">
                <table className="table-luxury">
                    <thead>
                        <tr>
                            <th>Date Created</th>
                            <th>Ingested (g)</th>
                            <th>Remaining (g)</th>
                            <th>Cost / Revenue</th>
                            <th>Net Profit</th>
                            <th>Fulfillment Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map((b: StockBatch) => {
                            const d = new Date(b.created_at.replace(' ', 'T') + 'Z');
                            const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            const isExhausted = b.remaining_grams === 0;
                            const profit = (b.total_revenue || 0) - (b.total_cost || 0);

                            return (
                                <tr key={b.id} style={{ opacity: isExhausted ? 0.65 : 1 }}>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} suppressHydrationWarning>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{date}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{time}</div>
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {b.grams.toFixed(2)}g
                                    </td>
                                    <td style={{ fontWeight: 700, color: isExhausted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                        {b.remaining_grams.toFixed(2)}g
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cost: ₹{(b.total_cost || 0).toFixed(2)}</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rev: ₹{(b.total_revenue || 0).toFixed(2)}</div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toFixed(2)}
                                    </td>
                                    <td>
                                        {isExhausted ? (
                                            <span className="badge-status depleted">Depleted</span>
                                        ) : (
                                            <span className="badge-status paid">Active Supplier</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            {!isExhausted && <CloseBatchBtn id={b.id} />}
                                            <EditBatchBtn batch={b} />
                                            {!isExhausted && b.grams === b.remaining_grams && (
                                                <DeleteBatchBtn id={b.id} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {batches.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No batch histories exist. Ingest your first batch to begin operation.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
