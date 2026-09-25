"use client";

import { useState, useEffect } from "react";
import { getStockBatches, getTotalStock, addStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { Layers, PackagePlus, PackageCheck, ArrowDownUp } from "lucide-react";
import { DeleteBatchBtn } from "@/components/ui/DeleteBatchBtn";
import { EditBatchBtn } from "@/components/ui/EditBatchBtn";
import { CloseBatchBtn } from "@/components/ui/CloseBatchBtn";
import { StockBatch } from "@/types";
import { useAccess } from "@/components/AccessProvider";
import { WorkspaceHeader, WorkspacePanel, WorkspaceSection } from "@/components/ui/Workspace";

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

    if (loading) return <div className="work-loading" role="status">Loading stock vault...</div>;

    return (
        <div className="workspace-page">
            <WorkspaceHeader eyebrow="INVENTORY / BATCHES" title="Stock vault" description="Track every incoming batch and its remaining weight. The oldest available stock is used first." aside={<div className="workspace-hero-stat"><span>Available stock</span><strong>{totalStock.toFixed(2)}g</strong></div>} />

            <div className="workspace-grid">
                {hasPermission("inventory.create") && <WorkspacePanel icon={<PackagePlus size={20} />} title="Receive stock" description="Add the weight of a newly arrived batch.">
                    <form onSubmit={handleAddBatch}>
                        <div className="form-group">
                            <label htmlFor="batch-grams">Batch weight (g) <span aria-hidden="true">*</span></label>
                            <input
                                id="batch-grams"
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="input-field"
                                value={grams}
                                onChange={e => setGrams(e.target.value)}
                                required
                                placeholder="e.g. 10.50"
                            />
                            <p className="field-hint">
                                Cost price per gram is read from the secured server environment at ingestion time.
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={adding}>
                            {adding ? "Adding batch..." : "Add batch"}
                        </button>
                    </form>
                </WorkspacePanel>}

                <WorkspacePanel icon={<Layers size={20} />} title="FIFO by default" description="Batch lineage stays traceable from receipt to sale." accent>
                    <ul className="info-list"><li><ArrowDownUp size={17} aria-hidden="true" /> Oldest available batches are allocated first.</li><li><PackageCheck size={17} aria-hidden="true" /> Fully used batches are shown as depleted.</li></ul>
                </WorkspacePanel>
            </div>

            <WorkspaceSection title="Batch history" description="Stock movement, profitability and batch controls." aside={<span className="work-pill">{batches.length} batches</span>} />
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
                            const d = new Date(b.created_at);
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
                            <tr><td colSpan={7} className="work-empty">No batches yet. Add your first batch to start tracking stock.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
