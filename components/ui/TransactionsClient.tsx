"use client";

import React, { useState, useMemo } from "react";
import { DeleteSaleBtn } from "./DeleteSaleBtn";
import { EditSaleBtn } from "./EditSaleBtn";
import { Search, DownloadCloud, Calendar, Database } from "lucide-react";
import { generateReceipt } from "@/lib/generateReceipt";
import { showToast } from "@/components/ToastProvider";
import { Sale, SaleBatchAssignment } from "@/types";

export function TransactionsClient({ initialSales }: { initialSales: Sale[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Memoize the filtered and sorted array
    const filteredSales = useMemo(() => {
        if (!initialSales) return [];

        return initialSales.filter(sale => {
            // 1. Text Search Filter (Customer Name, Comments, Amount)
            const searchObj = [
                sale.customer_name,
                sale.comments,
                sale.final_amount?.toString()
            ].join(" ").toLowerCase();

            if (searchTerm && !searchObj.includes(searchTerm.toLowerCase())) {
                return false;
            }

            // 2. Status Dropdown Filter
            const isLoan = sale.balance > 0;
            if (statusFilter === 'paid' && isLoan) return false;
            if (statusFilter === 'loan' && !isLoan) return false;

            return true;
        });
    }, [initialSales, searchTerm, statusFilter]);

    // Group the filtered array by Day
    const groupedSales = useMemo(() => {
        const groups: Record<string, Sale[]> = {};

        filteredSales.forEach(sale => {
            const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
            const dayString = d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            if (!groups[dayString]) {
                groups[dayString] = [];
            }
            groups[dayString].push(sale);
        });

        // Ensure chronological descending order of the object keys using the first item's true timestamp
        return Object.entries(groups).sort((a, b) => {
            const timeA = new Date(a[1][0].created_at.replace(' ', 'T') + 'Z').getTime();
            const timeB = new Date(b[1][0].created_at.replace(' ', 'T') + 'Z').getTime();
            return timeB - timeA;
        });
    }, [filteredSales]);

    return (
        <>
            {/* Filters Header */}
            <div className="transaction-toolbar">
                <div className="search-box" style={{ width: '100%', maxWidth: '380px' }}>
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        aria-label="Search transactions"
                        placeholder="Search by customer, notes, amount..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ position: "relative", minWidth: "200px" }}>
                    <select
                        className="input-field"
                        aria-label="Filter by payment status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ cursor: 'pointer', paddingRight: '2.5rem' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="paid">Fully Paid Only</option>
                        <option value="loan">Active Loans Only</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="table-luxury-container desktop-table-view">
                <table className="table-luxury" style={{ minWidth: '950px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '12%' }}>Time</th>
                            <th style={{ width: '22%' }}>Customer</th>
                            <th style={{ width: '12%' }}>Weight</th>
                            <th style={{ width: '12%' }}>Batch Ref</th>
                            <th style={{ width: '14%' }}>Final Amount</th>
                            <th style={{ width: '12%' }}>Status</th>
                            <th style={{ width: '16%', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedSales.map(([dayString, salesInDay], groupIndex) => (
                            <React.Fragment key={dayString}>
                                {/* Day-wise Header Separator */}
                                <tr>
                    <td colSpan={7} style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', borderTop: groupIndex > 0 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} suppressHydrationWarning>
                                            <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                                            {dayString}
                                        </div>
                                    </td>
                                </tr>

                                {/* Transactions for that specific day */}
                                {salesInDay.map((sale: Sale) => {
                                    const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
                                    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    const isLoan = sale.balance > 0;
                                    const isReversed = sale.status === 'REVERSED';
                                    const initial = sale.customer_name ? sale.customer_name.charAt(0).toUpperCase() : "C";

                                    // Prepare Batch Display string
                                    let batchesDisplay = "-";
                                    if (sale.batchesDeducted && sale.batchesDeducted.length > 0) {
                                        batchesDisplay = sale.batchesDeducted.map((b: SaleBatchAssignment) => `#${b.batch_id}`).join(', ');
                                    }

                                    return (
                                        <tr key={sale.id}>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} suppressHydrationWarning>
                                                {time}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span className="customer-avatar-badge">{initial}</span>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sale.customer_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {sale.grams_sold?.toFixed(2)}g
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {batchesDisplay}
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                                ₹{sale.final_amount?.toFixed(2)}
                                            </td>
                                            <td>
                                                {isReversed ? (
                                                    <span className="badge-status loan">Reversed</span>
                                                ) : isLoan ? (
                                                    <span className="badge-status loan">Loan (₹{sale.balance.toFixed(0)})</span>
                                                ) : (
                                                    <span className="badge-status paid">Paid</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                showToast("Generating Official Receipt...", "success");
                                                                await generateReceipt(sale);
                                                            } catch {
                                                                showToast("Failed to generate PDF", "error");
                                                            }
                                                        }}
                                                        className="action-icon-btn"
                                                        title="Download PDF Receipt"
                                                    >
                                                        <DownloadCloud size={16} />
                                                    </button>
                                                    {!isReversed && <EditSaleBtn sale={sale} />}
                                                    {!isReversed && <DeleteSaleBtn id={sale.id} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                                    <Database size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                                    <p style={{ margin: 0 }}>No transaction records match your filter.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="mobile-cards-view">
                {filteredSales.map((sale: Sale) => {
                    const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
                    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const isLoan = sale.balance > 0;
                    const isReversed = sale.status === 'REVERSED';
                    const initial = sale.customer_name ? sale.customer_name.charAt(0).toUpperCase() : "C";

                    return (
                        <div key={`m-tx-${sale.id}`} className="card-light" style={{ padding: '1.125rem' }}>
                            <div className="flex-between" style={{ marginBottom: '0.65rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="customer-avatar-badge">{initial}</span>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{sale.customer_name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }} suppressHydrationWarning>{date} · {time}</p>
                                    </div>
                                </div>
                                {isReversed ? (
                                    <span className="badge-status loan">Reversed</span>
                                ) : isLoan ? (
                                    <span className="badge-status loan">Loan</span>
                                ) : (
                                    <span className="badge-status paid">Paid</span>
                                )}
                            </div>

                            <div className="flex-between" style={{ borderTop: '1px solid var(--bg-subtle)', paddingTop: '0.65rem', marginTop: '0.4rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight: </span>
                                    <strong style={{ fontSize: '0.9rem' }}>{sale.grams_sold?.toFixed(2)}g</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem' }}>
                                        ₹{sale.final_amount?.toFixed(2)}
                                    </span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                showToast("Generating Receipt...", "success");
                                                await generateReceipt(sale);
                                            } catch {
                                                showToast("Failed to generate PDF", "error");
                                            }
                                        }}
                                        className="action-icon-btn"
                                        title="Download PDF"
                                    >
                                        <DownloadCloud size={15} />
                                    </button>
                                    {!isReversed && <EditSaleBtn sale={sale} />}
                                    {!isReversed && <DeleteSaleBtn id={sale.id} />}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredSales.length === 0 && (
                    <div className="card-light" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>No transactions found.</p>
                    </div>
                )}
            </div>
        </>
    );
}
