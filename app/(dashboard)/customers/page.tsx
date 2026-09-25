"use client";

import { useState, useEffect } from "react";
import { getCustomers, createCustomer, addCustomerPayment } from "@/lib/actions/customer.actions";
import { getCustomerLedger } from "@/lib/actions/ledger.actions";
import { generateCustomerReport } from "@/lib/generateCustomerReport";
import { showToast } from "@/components/ToastProvider";
import { UserPlus, IndianRupee, FileText, Trophy, UsersRound } from "lucide-react";
import { EditCustomerBtn } from "@/components/ui/EditCustomerBtn";
import { DeleteCustomerBtn } from "@/components/ui/DeleteCustomerBtn";
import { Customer } from "@/types";
import { useAccess } from "@/components/AccessProvider";
import { WorkspaceHeader, WorkspacePanel, WorkspaceSection } from "@/components/ui/Workspace";

export default function CustomersPage() {
    const { hasPermission } = useAccess();
    const canCreateCustomer = hasPermission("customers.create");
    const canCreatePayment = hasPermission("payments.create");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Customer State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [oldLoan, setOldLoan] = useState("");
    const [addingCustomer, setAddingCustomer] = useState(false);

    // Add Payment State
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [submittingPayment, setSubmittingPayment] = useState(false);

    async function loadCustomers() {
        try {
            const data = await getCustomers();
            setCustomers(Array.isArray(data) ? data : []);
        } catch {
            showToast("Failed to load customers", "error");
        }
        setLoading(false);
    }

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingCustomer(true);
        const fd = new FormData();
        fd.append("name", name);
        fd.append("phone", phone);
        if (oldLoan) fd.append("old_loan", oldLoan);

        const res = await createCustomer(fd);
        setAddingCustomer(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Customer registered successfully");
            setName("");
            setPhone("");
            setOldLoan("");
            loadCustomers();
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId) return;
        const amountNum = parseFloat(paymentAmount);

        if (isNaN(amountNum) || amountNum <= 0) return showToast("Invalid payment amount", "error");

        setSubmittingPayment(true);
        const res = await addCustomerPayment(selectedCustomerId, amountNum);
        setSubmittingPayment(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Payment applied to customer ledger");
            setPaymentAmount("");
            setSelectedCustomerId(null);
            loadCustomers();
        }
    };

    const totalOutstanding = customers.reduce((sum, c) => sum + (c.total_loan || 0) + (c.old_loan || 0), 0);

    if (loading) return <div className="work-loading" role="status">Loading customer directory...</div>;

    return (
        <div className="workspace-page">
            <WorkspaceHeader eyebrow="RELATIONSHIPS / LEDGER" title="Customers" description="Keep customer profiles, payment history and outstanding balances together." aside={<div className="workspace-hero-stat"><span>Total outstanding</span><strong>₹{totalOutstanding.toFixed(2)}</strong></div>} />

            <div className="workspace-grid">
                {canCreateCustomer && <WorkspacePanel icon={<UserPlus size={20} />} title="Add a customer" description="Create a profile before recording a sale or payment.">
                    <form onSubmit={handleCreateCustomer}>
                        <div className="form-group">
                            <label htmlFor="customer-name">Full name <span aria-hidden="true">*</span></label>
                            <input id="customer-name" type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Customer name" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="customer-phone">Phone number</label>
                            <input id="customer-phone" type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="customer-legacy">Opening balance (₹)</label>
                            <input id="customer-legacy" type="number" step="0.01" min="0" className="input-field" value={oldLoan} onChange={e => setOldLoan(e.target.value)} placeholder="0.00" />
                            <p className="field-hint">Payments clear this balance before newer debt.</p>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={addingCustomer}>
                            {addingCustomer ? "Creating profile..." : "Create customer"}
                        </button>
                    </form>
                </WorkspacePanel>}

                {selectedCustomerId && canCreatePayment && (
                    <WorkspacePanel icon={<IndianRupee size={20} />} title="Record payment" description={`From ${customers.find(c => c.id === selectedCustomerId)?.name || "customer"}`} accent>
                        <form onSubmit={handleAddPayment}>
                            <div className="form-group">
                                <label htmlFor="payment-amount">Amount received (₹) <span aria-hidden="true">*</span></label>
                                <input id="payment-amount" type="number" step="1" min="1" className="input-field" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required placeholder="0" autoFocus />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedCustomerId(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingPayment}>
                                    {submittingPayment ? "Processing..." : "Confirm Payment"}
                                </button>
                            </div>
                        </form>
                    </WorkspacePanel>
                )}

                {!selectedCustomerId && (
                    <WorkspacePanel icon={<Trophy size={20} />} title="Balance overview" description="Customers with the smallest balance appear first." accent>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {[...customers]
                                .sort((a, b) => ((a.total_loan || 0) + (a.old_loan || 0)) - ((b.total_loan || 0) + (b.old_loan || 0)))
                                .map((c, index) => {
                                    const combinedLoan = (c.total_loan || 0) + (c.old_loan || 0);
                                    return (
                                        <div
                                            key={`loyalty-${c.id}`}
                                            className="flex-between"
                                            style={{
                                                padding: '0.75rem 0.85rem',
                                                borderRadius: 'var(--radius-sm)',
                                                marginBottom: '0.35rem',
                                                backgroundColor: 'var(--bg-subtle)',
                                                border: index === 0 ? '1px solid var(--vault-border-bright)' : '1px solid transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: index === 0 ? 'var(--bg-dark)' : 'var(--border-subtle)',
                                                    color: index === 0 ? 'var(--accent)' : 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem'
                                                }}>
                                                    #{index + 1}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.name}</span>
                                            </div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.925rem', color: combinedLoan === 0 ? 'var(--success)' : 'var(--warning)' }}>
                                                ₹{combinedLoan.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            {customers.length === 0 && <div className="work-empty">No customers yet. Add your first profile to get started.</div>}
                        </div>
                    </WorkspacePanel>
                )}
            </div>

            <WorkspaceSection title="Customer directory" description="Profiles, balances and account actions." aside={<span className="work-pill"><UsersRound size={14} aria-hidden="true" /> {customers.length} customers</span>} />
            <div className="table-luxury-container">
                <table className="table-luxury">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Contact</th>
                            <th>Legacy Debt (₹)</th>
                            <th>App Debt (₹)</th>
                            <th>Total Balance (₹)</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c: Customer) => {
                            const combinedVal = (c.total_loan || 0) + (c.old_loan || 0);
                            const initial = c.name ? c.name.charAt(0).toUpperCase() : "C";

                            return (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="customer-avatar-badge">{initial}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{c.phone || 'N/A'}</td>
                                    <td style={{ fontFamily: 'monospace', color: c.old_loan > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                        {c.old_loan?.toFixed(2) || "0.00"}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', color: c.total_loan > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                        {c.total_loan?.toFixed(2) || "0.00"}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: combinedVal > 0 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            ₹{combinedVal.toFixed(2)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem' }}>
                                            {canCreatePayment && <button
                                                onClick={() => setSelectedCustomerId(c.id)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                                disabled={combinedVal <= 0}
                                            >
                                                Add Payment
                                            </button>}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        showToast("Generating Ledger Report...", "success");
                                                        const res = await getCustomerLedger(c.id);
                                                        if (res.error || !res.data) throw new Error(res.error || "Failed to load ledger data");
                                                        await generateCustomerReport(res.data);
                                                    } catch (e: unknown) {
                                                        const message = e instanceof Error ? e.message : "Failed to generate report";
                                                        showToast(message, "error");
                                                    }
                                                }}
                                                className="action-icon-btn"
                                                title="Download PDF Ledger Statement"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <EditCustomerBtn customer={c} />
                                            <DeleteCustomerBtn id={c.id} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {customers.length === 0 && (
                            <tr><td colSpan={6} className="work-empty">No customers registered yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
