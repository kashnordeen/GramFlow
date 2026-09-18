"use client";

import { useState, useEffect } from "react";
import { getCustomers, createCustomer, addCustomerPayment } from "@/lib/actions/customer.actions";
import { getCustomerLedger } from "@/lib/actions/ledger.actions";
import { generateCustomerReport } from "@/lib/generateCustomerReport";
import { showToast } from "@/components/ToastProvider";
import { UserPlus, IndianRupee, FileText, Trophy } from "lucide-react";
import { EditCustomerBtn } from "@/components/ui/EditCustomerBtn";
import { DeleteCustomerBtn } from "@/components/ui/DeleteCustomerBtn";
import { Customer } from "@/types";
import { useAccess } from "@/components/AccessProvider";

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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading customer directory...</div>
        </div>
    );

    return (
        <>
            <div className="flex-between" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1>Customers Directory</h1>
                    <p>Manage customer accounts, outstanding debt balances, and record payments.</p>
                </div>
                <div className="card-light" style={{ padding: '0.85rem 1.5rem', minWidth: '220px' }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                        Total Outstanding Debt
                    </p>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        <span style={{ fontSize: '1.1rem', marginRight: '2px', color: 'var(--text-muted)' }}>₹</span>{totalOutstanding.toFixed(2)}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'start' }}>
                {/* Register Customer Card */}
                {canCreateCustomer && <div className="card-light" style={{ padding: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.2rem' }}>
                        <UserPlus size={20} /> Register New Customer
                    </h3>
                    <form onSubmit={handleCreateCustomer}>
                        <div className="form-group">
                            <label>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
                        </div>
                        <div className="form-group">
                            <label>Legacy Balance (Optional) ₹</label>
                            <input type="number" step="0.01" min="0" className="input-field" value={oldLoan} onChange={e => setOldLoan(e.target.value)} placeholder="0.00" />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Incoming payments will automatically deduct from legacy balance first.</p>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={addingCustomer}>
                            {addingCustomer ? "Registering..." : "Create Customer Profile"}
                        </button>
                    </form>
                </div>}

                {/* Record Payment Form (if selected) */}
                {selectedCustomerId && canCreatePayment && (
                    <div className="card-light animate-fade-in" style={{ padding: '2rem', border: '2px solid var(--bg-dark)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                            <IndianRupee size={20} /> Record Payment Receipt
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                            Receiving payment from <strong>{customers.find(c => c.id === selectedCustomerId)?.name}</strong>
                        </p>
                        <form onSubmit={handleAddPayment}>
                            <div className="form-group">
                                <label>Payment Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="number" step="1" min="1" className="input-field" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required placeholder="0" autoFocus />
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
                    </div>
                )}

                {/* Loyalty Ranking Box */}
                {!selectedCustomerId && (
                    <div className="card-light" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '420px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
                                <Trophy size={20} /> Loyalty Ranking
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customers sorted by lowest outstanding balance.</p>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
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
                                                backgroundColor: index === 0 ? 'rgba(198, 255, 0, 0.15)' : 'var(--bg-subtle)',
                                                border: index === 0 ? '1px solid rgba(198, 255, 0, 0.4)' : '1px solid transparent'
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
                            {customers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No customers registered yet.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>Customer Directory</h2>
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
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No customers registered yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
