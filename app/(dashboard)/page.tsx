import { getDashboardMetrics } from "@/lib/actions/dashboard.actions";
import { getSessionUser } from "@/lib/actions/auth.actions";
import { Package, TrendingUp, IndianRupee, AlertTriangle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PendingLoansCard } from "@/components/ui/PendingLoansCard";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import { PrivacyToggleButton } from "@/components/ui/PrivacyToggleButton";
import Link from "next/link";

export default async function DashboardPage() {
  const [metrics, user] = await Promise.all([
    getDashboardMetrics(),
    getSessionUser()
  ]);

  if (!metrics || "error" in metrics) {
    return (
      <div className="card-light" style={{ padding: '3rem', textAlign: 'center', maxWidth: "600px", margin: "4rem auto" }}>
        <AlertTriangle size={54} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--danger)' }} />
        <h2>Unable to load dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>There was an error loading the dashboard metrics. {metrics?.error}</p>
        <p style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Please ensure the database setup script ran successfully and there are no schema issues.</p>
      </div>
    );
  }

  const { totalStock, salesToday, totalLoan, totalProfit, customersWithLoans } = metrics;
  const userName = user?.name ? user.name.split(' ')[0] : "Admin";

  const isLowStock = totalStock > 0 && totalStock < 5;
  const isZeroStock = totalStock === 0;
  const hour = new Date().getHours();
  const greeting = hour >= 4 && hour < 12 ? "Good Morning" : hour >= 12 && hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <>
      {/* 1. Hero & Low Stock Alert Section */}
      <section className="dashboard-hero">
        <div className="hero-text">
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
            {greeting}, {userName}! 👋
          </p>
          <h1>
            Here&apos;s what&apos;s happening with your <span className="highlight-today">business today.</span>
          </h1>
        </div>

        {(isLowStock || isZeroStock) && (
          <div className={`low-stock-card ${isZeroStock ? 'critical' : ''}`}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isZeroStock ? 'var(--danger)' : 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                <AlertTriangle size={14} />
                {isZeroStock ? 'OUT OF STOCK' : 'LOW STOCK WARNING'}
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Only {totalStock.toFixed(2)}g remaining
              </p>
            </div>
            <svg className="ecg-waveform-svg" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 14 H20 L26 4 L34 24 L42 8 L48 18 L54 14 H80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </section>

      {/* 2. Primary 4 KPI Cards */}
      <section className="kpi-grid">
        {/* Card 1: Total Stock (Dark Visual Anchor) */}
        <Link href="/stock" style={{ textDecoration: 'none' }}>
          <div className="card-dark" style={{ height: '100%', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span className="kpi-label">
                  <Package size={16} style={{ color: 'var(--accent)' }} /> Total Stock
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>Vault</span>
              </div>
              <div className="kpi-value">
                <AnimatedCounter value={totalStock} />
                <span style={{ fontSize: '1.3rem', marginLeft: '2px', fontWeight: 600 }}>g</span>
              </div>
              <p className="kpi-subtext" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Available Stock</p>
            </div>

            {/* Isometric 3D Stacked Blocks SVG */}
            <div className="isometric-stack-box">
              <svg width="68" height="52" viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bottom Cube */}
                <polygon points="34,34 56,22 34,10 12,22" fill="#1A1D1C" stroke="#C6FF00" strokeWidth="1.2" strokeOpacity="0.4" />
                <polygon points="12,22 34,34 34,48 12,36" fill="#141716" stroke="#C6FF00" strokeWidth="1.2" strokeOpacity="0.4" />
                <polygon points="34,34 56,22 56,36 34,48" fill="#181B1A" stroke="#C6FF00" strokeWidth="1.2" strokeOpacity="0.4" />
                {/* Top Glowing Cube */}
                <polygon points="34,22 50,13 34,4 18,13" fill="#C6FF00" fillOpacity="0.15" stroke="#C6FF00" strokeWidth="1.5" />
                <polygon points="18,13 34,22 34,32 18,23" fill="#C6FF00" fillOpacity="0.25" stroke="#C6FF00" strokeWidth="1.5" />
                <polygon points="34,22 50,13 50,23 34,32" fill="#C6FF00" fillOpacity="0.35" stroke="#C6FF00" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Card 2: Sales Today (Light Surface + Line Chart) */}
        <Link href="/transactions" style={{ textDecoration: 'none' }}>
          <div className="card-light" style={{ height: '100%', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span className="kpi-label">
                  <TrendingUp size={16} style={{ color: 'var(--text-primary)' }} /> Sales Today
                </span>
                <PrivacyToggleButton />
              </div>
              <div className="kpi-value">
                <span style={{ fontSize: '1.4rem', marginRight: '2px', color: 'var(--text-muted)' }}>₹</span>
                <PrivacyMask>
                  <AnimatedCounter value={salesToday.amount} />
                </PrivacyMask>
              </div>
              <p className="kpi-subtext">
                {salesToday.count} sales totalling <PrivacyMask>{salesToday.grams.toFixed(2)}g</PrivacyMask>
              </p>
            </div>

            {/* Lime Line Chart Graphic */}
            <div style={{ height: '40px', marginTop: '0.5rem', position: 'relative' }}>
              <svg width="100%" height="40" viewBox="0 0 160 40" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6FF00" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#C6FF00" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M0 34 Q 30 28, 60 22 T 110 14 T 155 6 L 155 40 L 0 40 Z" fill="url(#salesLineGrad)" />
                <path d="M0 34 Q 30 28, 60 22 T 110 14 T 155 6" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="155" cy="6" r="3.5" fill="#111312" stroke="#C6FF00" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Card 3: Lifetime Profit (Light Surface + Bar Chart) */}
        <div className="card-light" style={{ height: '100%', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span className="kpi-label">
                <IndianRupee size={16} style={{ color: 'var(--text-primary)' }} /> Lifetime Profit
              </span>
              <PrivacyToggleButton />
            </div>
            <div className="kpi-value">
              <span style={{ fontSize: '1.4rem', marginRight: '2px', color: 'var(--text-muted)' }}>₹</span>
              <PrivacyMask>
                <AnimatedCounter value={totalProfit} />
              </PrivacyMask>
            </div>
            <p className="kpi-subtext">FIFO cost-subtracted profit</p>
          </div>

          {/* Lime Bar Chart Graphic */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '36px', marginTop: '0.5rem' }}>
            {[25, 40, 35, 55, 48, 70, 65, 85, 92, 100].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  backgroundColor: i >= 7 ? 'var(--accent)' : '#E2E5DE',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Card 4: Pending Loans (Halftone + Modal Action) */}
        <PendingLoansCard totalLoan={totalLoan} customers={customersWithLoans || []} />
      </section>
    </>
  );
}
