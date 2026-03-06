"use client";

import { useState, useEffect } from "react";
import { getStockBatches, getTotalStock, addStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { Layers, PackagePlus } from "lucide-react";
import { DeleteBatchBtn } from "@/components/ui/DeleteBatchBtn";
import { EditBatchBtn } from "@/components/ui/EditBatchBtn";
import { CloseBatchBtn } from "@/components/ui/CloseBatchBtn";

export default function StockPage() {
    const [batches, setBatches] = useState<any[]>([]);
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

    if (loading) return <div className="text-center mt-2">Loading Vault...</div>;

    return (
        <>
            <div className="flex-between" style={{ marginBottom: "2.5rem" }}>
                <div>
                    <h1>Stock Vault</h1>
                    <p>Register new incoming Grams. Strict automated FIFO fulfillment ensures earliest batches clear first.</p>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem 2rem', border: '1px solid var(--accent)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Available Stock</p>
                    <div className="metric-value" style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)', display: 'flex', gap: '0.4rem' }}>
                        {totalStock.toFixed(2)}<span style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>g</span>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: "3rem" }}>
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <PackagePlus className="text-accent" size={24} /> Ingest New Batch
                    </h3>
                    <form onSubmit={handleAddBatch}>
                        <div className="form-group mb-2">
                            <label>Initial Gram Weight <span className="text-error">*</span></label>
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
                            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                Cost price is bound dynamically to ENVs upon ingestion.
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={adding}>
                            {adding ? "Writing to ledger..." : "Confirm Ingestion"}
                        </button>
                    </form>
                </div>

                <div className="glass-panel flex-center" style={{ padding: '2rem', flexDirection: 'column', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', border: 'none' }}>
                    <Layers size={64} style={{ opacity: 0.15, marginBottom: '1.5rem' }} />
                    <p style={{ textAlign: 'center', lineHeight: 1.6, maxWidth: '80%' }}>
                        <strong>FIFO Principle enforced automatically.</strong><br />
                        Sales will deduct weight progressively from the oldest batch below. When a batch hits 0.0g remaining, it is finalized.
                    </p>
                </div>
            </div>

            <h2>Historical Batches Master-list</h2>
            <div className="table-container table-responsive">
                <table>
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
                        {batches.map((b: any) => {
                            const d = new Date(b.created_at.replace(' ', 'T') + 'Z');
                            const date = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isExhausted = b.remaining_grams === 0;
                            const profit = (b.total_revenue || 0) - (b.total_cost || 0);

                            return (
                                <tr key={b.id} style={{ opacity: isExhausted ? 0.6 : 1 }}>
                                    <td style={{ color: 'var(--text-muted)' }}>{date}</td>
                                    <td style={{ fontWeight: 600 }}>{b.grams.toFixed(2)}g</td>
                                    <td style={{ fontWeight: 700, color: isExhausted ? 'var(--text-muted)' : 'var(--accent)' }}>
                                        {b.remaining_grams.toFixed(2)}g
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cost: ₹{(b.total_cost || 0).toFixed(2)}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Rev: ₹{(b.total_revenue || 0).toFixed(2)}</div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                                        {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toFixed(2)}
                                    </td>
                                    <td>
                                        {isExhausted ? (
                                            <span className="badge badge-success">Depleted</span>
                                        ) : (
                                            <span className="badge badge-info">Active Supplier</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {!isExhausted && <CloseBatchBtn id={b.id} />}
                                        <EditBatchBtn batch={b} />
                                        {!isExhausted && b.grams === b.remaining_grams && (
                                            <DeleteBatchBtn id={b.id} />
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {batches.length === 0 && (
                            <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>No batch histories exist. Ingest your first batch to begin operation.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
