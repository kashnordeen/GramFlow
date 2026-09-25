"use client";

import { useState, useEffect } from "react";
import { getCustomers } from "@/lib/actions/customer.actions";
import { createSale } from "@/lib/actions/sale.actions";
import { getTotalStock } from "@/lib/actions/stock.actions";
import { getSettings } from "@/lib/actions/settings.actions";
import { showToast } from "@/components/ToastProvider";
import { Calculator, CircleCheck, Layers3, ReceiptText, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { PremiumCheckmark } from "@/components/ui/PremiumCheckmark";
import { Customer } from "@/types";
import { useAccess } from "@/components/AccessProvider";
import { WorkspaceHeader, WorkspacePanel } from "@/components/ui/Workspace";

export default function AddSalePage() {
    const { hasPermission } = useAccess();
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalStock, setTotalStock] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    const [customerId, setCustomerId] = useState("");
    const [grams, setGrams] = useState("");
    const [discount, setDiscount] = useState("");
    const [amountReceived, setAmountReceived] = useState("");
    const [comments, setComments] = useState("");

    const [rateSettings, setRateSettings] = useState({ ratePerGram: 1000, special025: 250, special050: 500 });
    const [activeRatePerGram, setActiveRatePerGram] = useState("");
    const [activeSpecial025, setActiveSpecial025] = useState("");
    const [activeSpecial050, setActiveSpecial050] = useState("");

    const numGrams = parseFloat(grams) || 0;
    const numDiscount = parseFloat(discount) || 0;

    const rPerGram = parseFloat(activeRatePerGram) || rateSettings.ratePerGram;
    const sp025 = parseFloat(activeSpecial025) || rateSettings.special025;
    const sp050 = parseFloat(activeSpecial050) || rateSettings.special050;

    let grossAmount = 0;
    if (numGrams >= 0.25 && numGrams <= 0.30) {
        grossAmount = sp025;
    } else if (numGrams >= 0.50 && numGrams <= 0.60) {
        grossAmount = sp050;
    } else {
        grossAmount = numGrams * rPerGram;
    }
    const finalAmount = Math.max(0, grossAmount - numDiscount);
    const balance = Math.max(0, finalAmount - (parseFloat(amountReceived) || 0));

    const loadData = async () => {
        try {
            const [custRes, stockRes, settingsRes] = await Promise.all([getCustomers(), getTotalStock(), getSettings()]);
            setCustomers(Array.isArray(custRes) ? custRes : []);
            setTotalStock(typeof stockRes === 'number' ? stockRes : 0);

            if (settingsRes) {
                setRateSettings({
                    ratePerGram: settingsRes.rate_per_gram,
                    special025: settingsRes.special_025_030,
                    special050: settingsRes.special_050_060
                });

                const savedRate = localStorage.getItem("override_ratePerGram");
                const saved025 = localStorage.getItem("override_special025");
                const saved050 = localStorage.getItem("override_special050");

                setActiveRatePerGram(savedRate !== null ? savedRate : settingsRes.rate_per_gram.toString());
                setActiveSpecial025(saved025 !== null ? saved025 : settingsRes.special_025_030.toString());
                setActiveSpecial050(saved050 !== null ? saved050 : settingsRes.special_050_060.toString());
            }
        } catch {
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
        formData.append("gross_amount", grossAmount.toString());
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
                setTotalStock(prev => Math.max(0, prev - numGrams));
                loadData();
                router.refresh();
            }, 2500);
        }
    };

    if (loading) return <div className="work-loading" role="status">Loading sales workspace...</div>;

    if (!hasPermission("sales.create")) return <div className="card-light" style={{ padding: "2rem" }}>You do not have permission to create sales.</div>;

    return (
        <>
            {showSuccessAnim && (
                <div className="modal-overlay" style={{ zIndex: 999 }}>
                    <div className="modal-card flex-center" style={{ flexDirection: 'column', textAlign: 'center', padding: '3rem 2rem' }}>
                        <PremiumCheckmark />
                        <h3 style={{ fontSize: '1.4rem', marginTop: '1.25rem', marginBottom: '0.25rem' }}>Transaction Finalized!</h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Stock batches deducted & ledger updated.</p>
                    </div>
                </div>
            )}

            <div className="workspace-page">
            <WorkspaceHeader eyebrow="SALES / NEW TRANSACTION" title="Record a sale" description="Capture the customer, weight and payment in one guided flow. FIFO allocation is handled automatically." aside={<div className="workspace-hero-stat"><span>Available in vault</span><strong>{totalStock.toFixed(2)}g</strong></div>} />
            <div className="workspace-grid" data-layout="form">
                <WorkspacePanel icon={<ReceiptText size={20} />} title="Sale details" description="Complete the required fields to post the transaction." footer={<span>Every posted sale is written to the ledger and audit history.</span>}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="sale-customer">Customer <span aria-hidden="true">*</span></label>
                            <select id="sale-customer" className="input-field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                                <option value="">Choose a customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.phone ? "(" + c.phone + ")" : ""}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <div className="flex-between">
                                <label htmlFor="sale-grams">Weight sold (g) <span aria-hidden="true">*</span></label>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: numGrams > totalStock ? 'var(--danger)' : 'var(--text-muted)' }}>
                                    Vault: {totalStock.toFixed(2)}g
                                </span>
                            </div>
                            <input id="sale-grams" type="number" step="0.01" min="0.01" max={totalStock} className="input-field" placeholder="0.30" value={grams} onChange={(e) => setGrams(e.target.value)} required />
                        </div>

                        <details
                            style={{
                                marginBottom: '1.25rem',
                                padding: '0.85rem 1rem',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <summary style={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                Dynamic Rate Overrides (Optional)
                            </summary>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                <label htmlFor="sale-rate">Rate per gram (₹)</label>
                                    <input id="sale-rate" type="number" step="0.01" className="input-field" value={activeRatePerGram} onChange={(e) => {
                                        setActiveRatePerGram(e.target.value);
                                        localStorage.setItem("override_ratePerGram", e.target.value);
                                    }} />
                                </div>
                                <div className="rate-tier-grid">
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label htmlFor="sale-special-025">0.25g–0.30g bracket (₹)</label>
                                        <input id="sale-special-025" type="number" step="0.01" className="input-field" value={activeSpecial025} onChange={(e) => {
                                            setActiveSpecial025(e.target.value);
                                            localStorage.setItem("override_special025", e.target.value);
                                        }} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label htmlFor="sale-special-050">0.50g–0.60g bracket (₹)</label>
                                        <input id="sale-special-050" type="number" step="0.01" className="input-field" value={activeSpecial050} onChange={(e) => {
                                            setActiveSpecial050(e.target.value);
                                            localStorage.setItem("override_special050", e.target.value);
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </details>

                        <div className="form-group">
                            <label htmlFor="sale-discount">Discount (₹)</label>
                            <input id="sale-discount" type="number" step="1" min="0" className="input-field" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sale-received">Amount received (₹) <span aria-hidden="true">*</span></label>
                            <input id="sale-received" type="number" step="1" min="0" max={finalAmount || undefined} className="input-field" placeholder="0" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <div className="work-pill"><Layers3 size={15} aria-hidden="true" /> FIFO allocation enabled</div>
                            <p className="field-hint">The oldest available batches are consumed first.</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="sale-notes">Notes</label>
                            <textarea id="sale-notes" className="input-field" placeholder="Optional context for this sale" rows={2} value={comments} onChange={(e) => setComments(e.target.value)} style={{ resize: 'vertical' }} />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.9rem' }} disabled={submitting || customers.length === 0}>
                            {submitting ? 'Recording sale...' : 'Record sale'}
                        </button>
                        {customers.length === 0 && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>Please register a customer before recording sales.</p>
                        )}
                    </form>
                </WorkspacePanel>

                <WorkspacePanel icon={<Calculator size={20} />} title="Live calculation" description="Your billing preview updates as you enter values." accent>
                    <div className="metric-line"><span>Gross amount</span><strong>₹{grossAmount.toFixed(2)}</strong></div>
                    <div className="metric-line"><span>Discount</span><strong>−₹{numDiscount.toFixed(2)}</strong></div>
                    <div className="metric-total"><span>Final bill</span><strong>₹{finalAmount.toFixed(2)}</strong></div>
                    <div className="metric-line"><span>Outstanding after payment</span><strong style={{ color: balance > 0 ? 'var(--warning)' : 'var(--success)' }}>₹{balance.toFixed(2)}</strong></div>
                    <ul className="info-list" style={{ marginTop: '1rem' }}><li><ShieldCheck size={17} aria-hidden="true" /> FIFO batch lineage is recorded automatically.</li><li><CircleCheck size={17} aria-hidden="true" /> Partial payment creates a customer balance.</li></ul>
                </WorkspacePanel>
            </div>
            </div>
        </>
    );
}
