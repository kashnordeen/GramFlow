"use client";

import { useState, useEffect } from "react";
import { getCustomers } from "@/lib/actions/customer.actions";
import { createSale } from "@/lib/actions/sale.actions";
import { getTotalStock, getStockBatches } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { PremiumCheckmark } from "@/components/ui/PremiumCheckmark";

export default function AddSalePage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [totalStock, setTotalStock] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    const [customerId, setCustomerId] = useState("");
    const [grams, setGrams] = useState("");
    const [discount, setDiscount] = useState("");
    const [amountReceived, setAmountReceived] = useState("");
    const [comments, setComments] = useState("");
    const [batchId, setBatchId] = useState("");

    const ratePerGram = 1000;
    const numGrams = parseFloat(grams) || 0;
    const numDiscount = parseFloat(discount) || 0;

    let grossAmount = 0;
    if (numGrams >= 0.25 && numGrams <= 0.30) {
        grossAmount = 250;
    } else if (numGrams >= 0.50 && numGrams <= 0.60) {
        grossAmount = 500;
    } else {
        grossAmount = numGrams * ratePerGram;
    }
    const finalAmount = Math.max(0, grossAmount - numDiscount);
    const balance = Math.max(0, finalAmount - (parseFloat(amountReceived) || 0));

    const loadData = async () => {
        try {
            const [custRes, stockRes, batchesRes] = await Promise.all([getCustomers(), getTotalStock(), getStockBatches()]);
            setCustomers(Array.isArray(custRes) ? custRes : []);
            setTotalStock(typeof stockRes === 'number' ? stockRes : 0);
            setBatches(Array.isArray(batchesRes) ? batchesRes : []);
        } catch (err) {
            showToast("Failed to load initial data", "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) return showToast("Please select a customer", "error");
        if (numGrams <= 0) return showToast("Grams must be greater than 0", "error");
        if (numGrams > totalStock) return showToast("Insufficient stock available", "error");

        setSubmitting(true);
        const formData = new FormData();
        formData.append("customer_id", customerId);
        formData.append("grams_sold", grams);
        formData.append("discount", discount);
        formData.append("amount_received", amountReceived);
        if (batchId) formData.append("batch_id", batchId);
        if (comments) formData.append("comments", comments);

        const res = await createSale(formData);
        setSubmitting(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            setShowSuccessAnim(true);
            setTimeout(() => {
                setShowSuccessAnim(false);
                showToast("Sale recorded successfully!", "success");
                setGrams("");
                setDiscount("");
                setAmountReceived("");
                setComments("");
                setBatchId("");
                setTotalStock(prev => Math.max(0, prev - numGrams));
                loadData(); // Reload batches to update remaining grams
                router.refresh();
            }, 2500); // Overlay plays for 2.5 seconds to let the joint burn
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>
            <div className="text-accent" style={{ fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>Establishing Link...</div>
        </div>
    );

    return (
        <>
            {showSuccessAnim && (
                <div className="success-overlay">
                    <div className="success-icon-container">
                        <PremiumCheckmark />
                        <div className="success-text">Payment Processed!</div>
                        <p style={{ color: "var(--text-muted)", margin: 0 }}>Updating records...</p>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: "2.5rem" }}>
                <h1>Record a Sale</h1>
                <p>Complete a transaction securely. Stock deductions run via FIFO methodology.</p>
            </div>

            <div className="grid-2">
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-2">
                            <label>Select Customer <span className="text-error">*</span></label>
                            <select className="input-field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                                <option value="">-- Click to Select Customer --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.phone ? "(" + c.phone + ")" : ""}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group mb-2">
                            <label className="flex-between">
                                <span>Grams Sold <span className="text-error">*</span></span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: numGrams > totalStock ? 'var(--error)' : 'var(--text-muted)' }}>
                                    Max Available: {totalStock.toFixed(2)}g
                                </span>
                            </label>
                            <input type="number" step="0.01" min="0.01" max={totalStock} className="input-field" placeholder="e.g. 0.25" value={grams} onChange={(e) => setGrams(e.target.value)} required />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Special pricing: 0.25g-0.30g evaluated at ₹250. 0.50g-0.60g at ₹500. Regular rate: ₹1000/g.</div>
                        </div>

                        <div className="form-group mb-2">
                            <label>Manual Discount (₹)</label>
                            <input type="number" step="1" min="0" className="input-field" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                        </div>

                        <div className="form-group mb-2">
                            <label>Amount Received (₹) <span className="text-error">*</span></label>
                            <input type="number" step="1" min="0" max={finalAmount || undefined} className="input-field" placeholder="0" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} required />
                        </div>

                        <div className="form-group mb-2">
                            <label>Batch Allocation (Optional)</label>
                            <select className="input-field" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                                <option value="">Auto-Pilot (FIFO / Oldest First)</option>
                                {batches.filter(b => b.remaining_grams > 0).map(b => (
                                    <option key={b.id} value={b.id}>Batch #{b.id} ({b.remaining_grams.toFixed(2)}g remaining)</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group mb-2">
                            <label>Comments / Notes</label>
                            <textarea className="input-field" placeholder="Any special notes for this sale..." rows={2} value={comments} onChange={(e) => setComments(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }} disabled={submitting || customers.length === 0}>
                            {submitting ? 'Processing Network Transaction...' : 'Finalize Sale'}
                        </button>
                        {customers.length === 0 && (
                            <p style={{ color: 'var(--error)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>Please add a customer prior to creating a sale.</p>
                        )}
                    </form>
                </div>

                <div>
                    <div className="glass-card" style={{ position: 'sticky', top: '2rem' }}>
                        <div className="flex-between" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Calculator size={22} className="text-accent" />
                                Live Computation
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="flex-between">
                                <span style={{ color: 'var(--text-muted)' }}>Gross Output</span>
                                <span className="metric-value" style={{ fontSize: '1.3rem', margin: 0 }}>₹{grossAmount.toFixed(2)}</span>
                            </div>

                            <div className="flex-between">
                                <span style={{ color: 'var(--text-muted)' }}>Discount Adjusted</span>
                                <span className="metric-value" style={{ fontSize: '1.3rem', margin: 0, color: 'var(--error)' }}>-₹{numDiscount.toFixed(2)}</span>
                            </div>

                            <div className="flex-between" style={{ borderTop: '1px dashed var(--card-border)', paddingTop: '1.5rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Final Billing</span>
                                <span className="metric-value" style={{ fontSize: '1.8rem', margin: 0, color: 'var(--accent)' }}>₹{finalAmount.toFixed(2)}</span>
                            </div>

                            <div className="flex-between" style={{ background: 'rgba(0,0,0,0.4)', padding: '1.25rem', borderRadius: '12px', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Remaining Balance (Loan)</span>
                                <span className="metric-value" style={{ fontSize: '1.4rem', margin: 0, color: balance > 0 ? '#facc15' : 'var(--success)' }}>
                                    ₹{balance.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
