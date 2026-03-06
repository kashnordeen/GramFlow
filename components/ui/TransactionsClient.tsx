"use client";

import React, { useState, useMemo } from "react";
import { DeleteSaleBtn } from "./DeleteSaleBtn";
import { EditSaleBtn } from "./EditSaleBtn";
import { FileText, Database, Search, Filter, DownloadCloud } from "lucide-react";
import { generateReceipt } from "@/lib/generateReceipt";
import { showToast } from "@/components/ToastProvider";

export function TransactionsClient({ initialSales }: { initialSales: any[] }) {
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
        const groups: Record<string, any[]> = {};

        filteredSales.forEach(sale => {
            const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
            // Format to 'March 5, 2026' style for header
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
            <div className="flex-between" style={{ marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "400px" }}>
                    <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        type="text"
                        placeholder="Search by customer, notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem 0.8rem 2.8rem",
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--card-border)",
                            color: "var(--text-main)",
                            outline: "none",
                            transition: "var(--transition)"
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
                    />
                </div>

                <div style={{ position: "relative", minWidth: "200px" }}>
                    <Filter size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem 0.8rem 2.8rem",
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--card-border)",
                            color: "var(--text-main)",
                            colorScheme: "dark",
                            outline: "none",
                            appearance: "none",
                            cursor: "pointer"
                        }}
                    >
                        <option value="all" style={{ background: '#0f1012', color: 'white' }}>All Statuses</option>
                        <option value="paid" style={{ background: '#0f1012', color: 'white' }}>Fully Paid Only</option>
                        <option value="loan" style={{ background: '#0f1012', color: 'white' }}>Active Loans Only</option>
                    </select>
                </div>
            </div>

            <div className="table-container table-responsive">
                <table style={{ minWidth: '1000px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '10%' }}>Time</th>
                            <th style={{ width: '20%' }}>Customer</th>
                            <th style={{ width: '10%' }}>Weight</th>
                            <th style={{ width: '10%' }}>Batch</th>
                            <th style={{ width: '12%' }}>Final Amount</th>
                            <th style={{ width: '10%' }}>Status</th>
                            <th style={{ width: '15%' }}>Comments / Notes</th>
                            <th style={{ width: '13%', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedSales.map(([dayString, salesInDay], groupIndex) => (
                            <React.Fragment key={dayString}>
                                {/* Day-wise Header Separator */}
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <td colSpan={7} style={{ padding: '0.8rem 1rem', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--card-border)', borderTop: groupIndex > 0 ? '1px solid var(--card-border)' : 'none' }}>
                                        {dayString}
                                    </td>
                                </tr>

                                {/* Transactions for that specific day */}
                                {salesInDay.map((sale: any) => {
                                    const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
                                    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    const isLoan = sale.balance > 0;

                                    let displayComments = sale.comments;
                                    let adminInitial = null;

                                    // Creative Admin Tag Extraction
                                    if (sale.comments && sale.comments.includes('||ADMIN||')) {
                                        const tagRegex = /\|\|ADMIN\|\|(.*?)\|\|/;
                                        const match = sale.comments.match(tagRegex);
                                        if (match && match[1]) {
                                            adminInitial = match[1].charAt(0).toUpperCase();
                                        }
                                        // Strip the tag so it doesn't show in the main text note field
                                        displayComments = sale.comments.replace(tagRegex, '').trim();
                                    }

                                    // Prepare Batch Display string
                                    let batchesDisplay = "-";
                                    if (sale.batchesDeducted && sale.batchesDeducted.length > 0) {
                                        batchesDisplay = sale.batchesDeducted.map((b: any) => `#${b.batch_id}`).join(', ');
                                    }

                                    return (
                                        <tr key={sale.id}>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    {adminInitial ? (
                                                        <div style={{
                                                            minWidth: '24px', height: '24px', borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            color: 'white',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.75rem', fontWeight: '800',
                                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                            border: '1px solid rgba(255,255,255,0.2)'
                                                        }}>
                                                            {adminInitial}
                                                        </div>
                                                    ) : (
                                                        <div style={{ minWidth: '24px' }}></div> // Spacer for older unsaved records
                                                    )}
                                                    <span>{time}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--text-main)' }}>{sale.customer_name}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{sale.grams_sold?.toFixed(2)}g</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{batchesDisplay}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text-main)' }}>₹{sale.final_amount?.toFixed(2)}</td>
                                            <td>
                                                {isLoan ? (
                                                    <span className="badge badge-warning">Loan (₹{sale.balance.toFixed(0)})</span>
                                                ) : (
                                                    <span className="badge badge-success">Paid</span>
                                                )}
                                            </td>
                                            <td>
                                                {displayComments ? (
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <FileText size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} className="text-accent" />
                                                        <span style={{ fontStyle: 'italic', wordBreak: 'break-word' }}>{displayComments}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', opacity: 0.5 }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', width: '100%' }}>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                showToast("Generating Official Receipt...", "success");
                                                                await generateReceipt(sale);
                                                            } catch (e) {
                                                                showToast("Failed to generate PDF", "error");
                                                            }
                                                        }}
                                                        className="btn btn-icon"
                                                        title="Download Auto-Generated Receipt"
                                                        style={{ color: 'var(--text-main)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }}
                                                    >
                                                        <DownloadCloud size={16} />
                                                    </button>
                                                    <EditSaleBtn sale={sale} />
                                                    <DeleteSaleBtn id={sale.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </React.Fragment>
                        ))}

                        {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center" style={{ padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                                    No transaction records found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
