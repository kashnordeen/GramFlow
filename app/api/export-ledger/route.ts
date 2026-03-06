import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/actions/auth.actions';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const user = await getSessionUser();

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const db = getDb();

        // 1. Fetch Outstanding Loans
        const customers = db.prepare(`
            SELECT id, name, phone, total_loan, old_loan 
            FROM customers 
            WHERE (total_loan + old_loan) > 0 
            ORDER BY (total_loan + old_loan) DESC
        `).all() as any[];

        // 2. Fetch Active Inventory
        const stockBatches = db.prepare(`
            SELECT id, grams, price_per_gram, remaining_grams, created_at
            FROM stock_batches 
            WHERE remaining_grams > 0 
            ORDER BY created_at ASC
        `).all() as any[];

        // 3. Fetch Recent Sales (Last 50)
        const recentSales = db.prepare(`
            SELECT s.id, c.name as customer_name, s.grams_sold, s.final_amount, s.amount_received, s.balance, s.created_at
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
            LIMIT 50
        `).all() as any[];

        const totalDebt = customers.reduce((sum, c) => sum + (c.total_loan || 0) + (c.old_loan || 0), 0);
        const totalStock = stockBatches.reduce((sum, b) => sum + (b.remaining_grams || 0), 0);

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GramFlow Ledger Snapshot - ${new Date().toLocaleDateString()}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: #fff;
                }
                .header {
                    border-bottom: 2px solid #222;
                    padding-bottom: 1rem;
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                h1 { margin: 0; color: #111; font-size: 2rem; }
                .meta { text-align: right; color: #555; font-size: 0.9rem; }
                
                h2 { color: #222; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin-top: 2rem; }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1rem;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px 12px;
                    text-align: left;
                    font-size: 0.95rem;
                }
                th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                    color: #333;
                }
                tr:nth-child(even) { background-color: #fcfcfc; }
                .text-right { text-align: right; }
                .amount { font-family: monospace; font-weight: 500; }
                
                .summary-cards {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .summary-card {
                    background: #f9f9f9;
                    border: 1px solid #eee;
                    padding: 1.5rem;
                    border-radius: 8px;
                    flex: 1;
                    text-align: center;
                }
                .summary-card h3 { margin: 0 0 0.5rem 0; color: #555; font-size: 0.9rem; text-transform: uppercase; }
                .summary-card .value { font-size: 1.5rem; font-weight: bold; color: #111; }

                /* Print optimizations */
                @media print {
                    body { padding: 0; }
                    @page { margin: 1.5cm; }
                    .no-print { display: none; }
                    tr, td, th { page-break-inside: avoid; }
                    h2 { page-break-after: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="background:#e3ff37; color:#000; padding:1rem; text-align:center; margin-bottom: 2rem; border-radius: 8px; font-weight: bold;">
                Opening print dialog automatically. If it doesn't appear, press <kbd>Ctrl+P</kbd> or <kbd>Cmd+P</kbd>.
            </div>

            <div class="header">
                <div>
                    <h1>GramFlow Ledger Snapshot</h1>
                    <p style="margin: 0.5rem 0 0 0; color: #666;">Confidential Financial & Inventory Report</p>
                </div>
                <div class="meta">
                    <p style="margin:0 0 0.25rem 0;">Generated: <strong>${new Date().toLocaleString()}</strong></p>
                    <p style="margin:0;">Requested By: <strong>${user.name}</strong> (${user.email})</p>
                </div>
            </div>

            <div class="summary-cards">
                <div class="summary-card">
                    <h3>Total Outstanding Debt</h3>
                    <div class="value amount">₹${totalDebt.toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <h3>Available Stock</h3>
                    <div class="value">${totalStock.toFixed(2)}g</div>
                </div>
                <div class="summary-card">
                    <h3>Active Debtors</h3>
                    <div class="value">${customers.length}</div>
                </div>
            </div>

            <h2>Active Pending Loans</h2>
            ${customers.length === 0 ? '<p>No outstanding loans.</p>' : `
            <table>
                <thead>
                    <tr>
                        <th width="35%">Customer Name</th>
                        <th width="25%">Phone Number</th>
                        <th width="40%" class="text-right">Outstanding Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr>
                            <td><strong>${c.name}</strong></td>
                            <td style="color:#666">${c.phone || 'N/A'}</td>
                            <td class="text-right amount" style="color:#d32f2f">₹${((c.total_loan || 0) + (c.old_loan || 0)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            `}

            <h2>Available Inventory</h2>
            ${stockBatches.length === 0 ? '<p>No stock available.</p>' : `
            <table>
                <thead>
                    <tr>
                        <th width="20%">Date Added</th>
                        <th width="35%">Batch Name</th>
                        <th width="20%" class="text-right">Remaining Vol</th>
                        <th width="25%" class="text-right">Base Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${stockBatches.map(b => `
                        <tr>
                            <td style="color:#666">${new Date(b.created_at.replace(' ', 'T') + 'Z').toLocaleDateString()}</td>
                            <td><strong>Batch #${b.id}</strong> (Original: ${b.grams.toFixed(2)}g)</td>
                            <td class="text-right amount">${b.remaining_grams.toFixed(2)}g</td>
                            <td class="text-right amount">₹${b.price_per_gram.toFixed(0)}/g</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            `}

            <h2>Recent Transactions (Last 50)</h2>
            ${recentSales.length === 0 ? '<p>No recent sales.</p>' : `
            <table>
                <thead>
                    <tr>
                        <th width="20%">Date</th>
                        <th width="25%">Customer</th>
                        <th width="15%" class="text-right">Volume</th>
                        <th width="20%" class="text-right">Final Amount</th>
                        <th width="20%" class="text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentSales.map(s => {
            const isLoan = s.balance > 0;
            return `
                        <tr>
                            <td style="color:#666">${new Date(s.created_at.replace(' ', 'T') + 'Z').toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td>${s.customer_name}</td>
                            <td class="text-right amount">${s.grams_sold.toFixed(2)}g</td>
                            <td class="text-right amount">₹${s.final_amount.toFixed(2)}</td>
                            <td class="text-right" style="color: ${isLoan ? '#d32f2f' : '#388e3c'}; font-weight: bold;">
                                ${isLoan ? `LOAN (₹${s.balance.toFixed(0)})` : 'PAID'}
                            </td>
                        </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
            `}

            <div style="margin-top: 3rem; text-align: center; color: #888; font-size: 0.8rem; border-top: 1px solid #eee; padding-top: 1rem;">
                End of Report - GramFlow Inventory Management System
            </div>

            <script>
                // Instantly trigger browser print dialog upon page load
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
        `;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            },
        });

    } catch (error) {
        console.error("Ledger Export Error:", error);
        return new Response("Internal Server Error generating PDF snapshot", { status: 500 });
    }
}
