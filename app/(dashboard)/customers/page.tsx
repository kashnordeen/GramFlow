"use client";

import { useState, useEffect } from "react";
import { getCustomers, createCustomer, addCustomerPayment } from "@/lib/actions/customer.actions";
import { getCustomerLedger } from "@/lib/actions/ledger.actions";
import { generateCustomerReport } from "@/lib/generateCustomerReport";
import { showToast } from "@/components/ToastProvider";
import { UserPlus, IndianRupee, Users, FileText } from "lucide-react";
import { EditCustomerBtn } from "@/components/ui/EditCustomerBtn";
import { DeleteCustomerBtn } from "@/components/ui/DeleteCustomerBtn";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
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
            showToast("Customer added successfully");
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

        if (isNaN(amountNum) || amountNum <= 0) return showToast("Invalid amount", "error");

        setSubmittingPayment(true);
        const res = await addCustomerPayment(selectedCustomerId, amountNum);
        setSubmittingPayment(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Payment recorded successfully");
            setPaymentAmount("");
            setSelectedCustomerId(null);
            loadCustomers();
        }
    };

    const totalOutstanding = customers.reduce((sum, c) => sum + (c.total_loan || 0) + (c.old_loan || 0), 0);

    if (loading) return <div className="text-center mt-2">Loading Directory...</div>;

    return (
        <>
            <div className="flex-between" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1>Customers Directory</h1>
                    <p>Manage customer profiles, view active loans, and record pending payments.</p>
                </div>
                <div className="glass-card" style={{ padding: '1rem', minWidth: '200px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Outstanding Loans</p>
                    <p className="metric-value" style={{ margin: 0, fontSize: '1.5rem', color: totalOutstanding > 0 ? '#facc15' : 'var(--text-main)' }}>
                        <span className="metric-currency">₹</span>{totalOutstanding.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="grid-2">
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <UserPlus className="text-accent" size={24} /> Register New Customer
                    </h3>
                    <form onSubmit={handleCreateCustomer}>
                        <div className="form-group mb-1">
                            <label>Full Name <span className="text-error">*</span></label>
                            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
                        </div>
                        <div className="form-group mb-1">
                            <label>Phone Number</label>
                            <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
                        </div>
                        <div className="form-group mb-1">
                            <label>Legacy Debt (Optional) ₹</label>
                            <input type="number" step="0.01" min="0" className="input-field" value={oldLoan} onChange={e => setOldLoan(e.target.value)} placeholder="0.00" />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Any payments received will auto-deduct from this legacy amount first.</p>
                        </div>
                        <button type="submit" className="btn btn-secondary w-100" style={{ width: '100%', marginTop: '1rem' }} disabled={addingCustomer}>
                            {addingCustomer ? "Saving..." : "Create Profile"}
                        </button>
                    </form>
                </div>

                {selectedCustomerId && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', border: '1px solid var(--accent)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <IndianRupee className="text-accent" size={24} /> Record Payment
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Recording payment for <strong>{customers.find(c => c.id === selectedCustomerId)?.name}</strong>
                        </p>
                        <form onSubmit={handleAddPayment}>
                            <div className="form-group mb-1">
                                <label>Amount (₹) <span className="text-error">*</span></label>
                                <input type="number" step="1" min="1" className="input-field border-accent" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required placeholder="0" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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

                {!selectedCustomerId && (
                    <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '450px', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem 2rem 1.5rem 2rem', borderBottom: '1px solid var(--card-border)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Users className="text-accent" size={24} /> Loyalty Ranking
                            </h3>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customers sorted by lowest outstanding balance.</p>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                            {[...customers]
                                .sort((a, b) => ((a.total_loan || 0) + (a.old_loan || 0)) - ((b.total_loan || 0) + (b.old_loan || 0)))
                                .map((c, index) => {
                                    const combinedLoan = (c.total_loan || 0) + (c.old_loan || 0);
                                    return (
                                        <div key={`loyalty-${c.id}`} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: index < 3 ? 'rgba(227, 255, 55, 0.05)' : 'transparent',
                                            border: index < 3 ? '1px solid rgba(227, 255, 55, 0.2)' : '1px solid transparent',
                                            borderBottom: index >= 3 ? '1px solid var(--card-border)' : undefined,
                                            borderRadius: index < 3 ? '8px' : '0',
                                            marginBottom: index < 3 ? '0.5rem' : '0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    background: index === 0 ? '#ffcf33' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--bg-darker)',
                                                    color: index < 3 ? '#000' : 'var(--text-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 'bold', fontSize: '0.8rem'
                                                }}>
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: index < 3 ? 600 : 500, color: index < 3 ? 'var(--text-main)' : 'var(--text-muted)' }}>{c.name}</div>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: combinedLoan === 0 ? 'var(--success)' : combinedLoan < 500 ? 'var(--text-main)' : '#facc15'
                                            }}>
                                                ₹{combinedLoan.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            {customers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No customers found.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Customer List</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact Details</th>
                            <th>Legacy Debt (₹)</th>
                            <th>App Debt (₹)</th>
                            <th>Total Owed (₹)</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c: any) => {
                            const combinedVal = (c.total_loan || 0) + (c.old_loan || 0);
                            return (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{c.phone || 'N/A'}</td>
                                    <td style={{ fontFamily: 'monospace', color: c.old_loan > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                                        {c.old_loan?.toFixed(2) || "0.00"}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', color: c.total_loan > 0 ? '#facc15' : 'var(--text-muted)' }}>
                                        {c.total_loan?.toFixed(2) || "0.00"}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            color: combinedVal > 0 ? '#facc15' : 'var(--success)'
                                        }}>
                                            ₹{combinedVal.toFixed(2)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem' }}>
                                        <button
                                            onClick={() => setSelectedCustomerId(c.id)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
                                            disabled={combinedVal <= 0}
                                        >
                                            Add Payment
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    showToast("Aggregating Ledger Report...", "success");
                                                    const res = await getCustomerLedger(c.id);
                                                    if (res.error) throw new Error(res.error);
                                                    await generateCustomerReport(res);
                                                } catch (e: any) {
                                                    showToast(e.message || "Failed to generate report", "error");
                                                }
                                            }}
                                            className="btn btn-icon"
                                            title="Download Full Ledger Statement"
                                            style={{ color: 'var(--text-main)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', marginRight: '0.5rem' }}
                                        >
                                            <FileText size={16} />
                                        </button>
                                        <EditCustomerBtn customer={c} />
                                        <DeleteCustomerBtn id={c.id} />
                                    </td>
                                </tr>
                            );
                        })}
                        {customers.length === 0 && (
                            <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>No customers registered yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
