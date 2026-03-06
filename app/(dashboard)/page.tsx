import { getDashboardMetrics } from "@/lib/actions/dashboard.actions";
import { Package, TrendingUp, IndianRupee, AlertTriangle, Users } from "lucide-react";
import { DeleteSaleBtn } from "@/components/ui/DeleteSaleBtn";
import { EditSaleBtn } from "@/components/ui/EditSaleBtn";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PendingLoansCard } from "@/components/ui/PendingLoansCard";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import { PrivacyToggleButton } from "@/components/ui/PrivacyToggleButton";
import Link from "next/link";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  if (!metrics || "error" in metrics) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: "600px", margin: "4rem auto" }}>
        <AlertTriangle size={64} className="text-error" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
        <h2>Database Not Initialized</h2>
        <p style={{ color: 'var(--text-muted)' }}>There was an error loading the dashboard metrics. {metrics?.error}</p>
        <p style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Please ensure the database setup script ran successfully and there are no schema issues.</p>
      </div>
    );
  }

  const { totalStock, salesToday, totalLoan, totalProfit, recentSales, customersWithLoans } = metrics;

  const isLowStock = totalStock > 0 && totalStock < 5;
  const isZeroStock = totalStock === 0;

  return (
    <>
      <div className="flex-between" style={{ marginBottom: "2rem" }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to GramFlow. Here's your business at a glance.</p>
        </div>

        {(isLowStock || isZeroStock) && (
          <div className="glass-card" style={{ borderColor: isZeroStock ? 'var(--error)' : '#facc15', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', background: isZeroStock ? 'var(--error-bg)' : 'rgba(234, 179, 8, 0.1)' }}>
            <AlertTriangle color={isZeroStock ? 'var(--error)' : '#facc15'} size={28} />
            <div>
              <p style={{ color: 'var(--text-main)', fontWeight: 600, margin: 0, fontSize: '1.1rem' }}>
                {isZeroStock ? 'Out of Stock' : 'Low Stock Warning'}
              </p>
              <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>Only {totalStock.toFixed(2)}g remaining</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid-dashboard">
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <span className="metric-label">Total Stock</span>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '10px' }}>
              <Package size={22} className="text-accent" />
            </div>
          </div>
          <div className="metric-value">
            <AnimatedCounter value={totalStock} />
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginLeft: '4px' }}>g</span>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sales Today <PrivacyToggleButton />
            </span>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '10px' }}>
              <TrendingUp size={22} className="text-accent" />
            </div>
          </div>
          <div className="metric-value">
            <span className="metric-currency">₹</span>
            <PrivacyMask>
              <AnimatedCounter value={salesToday.amount} />
            </PrivacyMask>
          </div>
          <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-muted)' }}>
            {salesToday.count} sales totalling <PrivacyMask>{salesToday.grams.toFixed(2)}g</PrivacyMask>
          </p>
        </div>

        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Lifetime Profit <PrivacyToggleButton />
            </span>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '10px' }}>
              <IndianRupee size={22} className="text-accent" />
            </div>
          </div>
          <div className="metric-value">
            <span className="metric-currency">₹</span>
            <PrivacyMask>
              <AnimatedCounter value={totalProfit} />
            </PrivacyMask>
          </div>
        </div>

        <PendingLoansCard totalLoan={totalLoan} customers={customersWithLoans || []} />
      </div>

      <div className="flex-between" style={{ marginTop: '3rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Recent Transactions</h2>
        <Link href="/transactions" className="btn btn-secondary flex-center" style={{ gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          View All Transactions
        </Link>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Sold Weight</th>
              <th>Final Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale: any) => {
              const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
              const date = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isLoan = sale.balance > 0;
              return (
                <tr key={sale.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{date}</td>
                  <td style={{ fontWeight: 500, fontSize: '1.05rem' }}>{sale.customer_name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sale.grams_sold.toFixed(2)}g</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text-main)' }}>₹{sale.final_amount.toFixed(2)}</td>
                  <td>
                    {isLoan ? (
                      <span className="badge badge-warning">Loan (₹{sale.balance.toFixed(0)})</span>
                    ) : (
                      <span className="badge badge-success">Paid</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <DeleteSaleBtn id={sale.id} />
                  </td>
                </tr>
              )
            })}

            {recentSales.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center" style={{ padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No recent sales found. Go to "Add Sale" to record your first transaction.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
