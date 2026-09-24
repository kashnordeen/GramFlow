import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  PackageOpen,
  ReceiptIndianRupee,
  WalletCards,
} from "lucide-react";
import { BusinessPulse } from "@/components/dashboard/BusinessPulse";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import styles from "@/components/dashboard/dashboard.module.css";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Surface } from "@/components/ui/Surface";
import { PrivacyToggleButton } from "@/components/ui/PrivacyToggleButton";
import { getDashboardMetrics } from "@/lib/actions/dashboard.actions";
import { getSessionUser } from "@/lib/actions/auth.actions";
import { getDashboardDataState, normalizeDashboardPeriod } from "@/lib/dashboard";

interface DashboardPageProps {
  searchParams?: Promise<{ period?: string }>;
}

function DashboardUnavailable() {
  return (
    <Surface as="section" className={styles.errorState} tone="feature">
      <div>
        <span className={styles.errorIcon} aria-hidden="true">
          <AlertTriangle size={28} />
        </span>
        <h1>Dashboard is temporarily unavailable</h1>
        <p>
          We could not load live business metrics. Your navigation and account
          controls still work, and no data was changed.
        </p>
        <Link className={styles.retryLink} href="/">
          Try again <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </Surface>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const period = normalizeDashboardPeriod((await searchParams)?.period);
  const [metrics, user] = await Promise.all([
    getDashboardMetrics(period),
    getSessionUser(),
  ]);

  if (!metrics || "error" in metrics) return <DashboardUnavailable />;

  const dataState = getDashboardDataState(metrics.setup);
  const permissions = user?.permissions ?? [];
  const firstName = user?.name?.split(" ")[0] || "Operator";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Business command center</p>
          <h1 className={styles.pageTitle}>{greeting}, {firstName}</h1>
          <p className={styles.pageDescription}>
            Live inventory, margin, customer balances, and the next decisions
            that need your attention.
          </p>
        </div>
        <div className={styles.headerTools}>
          <span className={styles.contextPill}>
            <span className={styles.contextDot} aria-hidden="true" />
            Live data · {period} day view
          </span>
          <PrivacyToggleButton />
        </div>
      </header>

      {dataState === "empty" ? (
        <DashboardEmptyState permissions={permissions} setup={metrics.setup} />
      ) : (
        <>
          {dataState === "partial" && (
            <aside className={styles.partialBanner} aria-label="Setup status">
              <div>
                <strong>Some modules need more data</strong>
                <p>Available business signals remain visible while you finish setup.</p>
              </div>
              <StatusBadge tone="info">Setup in progress</StatusBadge>
            </aside>
          )}

          <section className={styles.featureGrid} aria-label="Business pulse and key metrics">
            <BusinessPulse
              canAddStock={permissions.includes("inventory.create")}
              oldestBatchAgeDays={metrics.stock.oldestBatchAgeDays}
              openBatchCount={metrics.stock.openBatchCount}
              status={metrics.stock.status}
              totalGrams={metrics.stock.totalGrams}
            />
            <div className={styles.metricGrid}>
              <MetricCard
                changePercent={metrics.salesToday.changePercent}
                href={permissions.includes("sales.read") ? "/transactions" : undefined}
                icon={ReceiptIndianRupee}
                label="Sales today"
                prefix="₹"
                sensitive
                supportingText={`${metrics.salesToday.count} posted sales`}
                value={metrics.salesToday.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              />
              <MetricCard
                changePercent={metrics.grossProfit.changePercent}
                icon={CircleDollarSign}
                label={`${period} day gross profit`}
                prefix="₹"
                sensitive
                supportingText={`${metrics.grossProfit.marginPercent?.toFixed(1) ?? "0.0"}% margin`}
                value={metrics.grossProfit.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              />
              <MetricCard
                href={permissions.includes("inventory.read") ? "/stock" : undefined}
                icon={PackageOpen}
                label="Available stock"
                sensitive
                supportingText={`${metrics.stock.openBatchCount} open batches`}
                suffix="g"
                value={metrics.stock.totalGrams.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              />
              <MetricCard
                href={permissions.includes("customers.read") ? "/customers" : undefined}
                icon={WalletCards}
                label="Outstanding balance"
                prefix="₹"
                sensitive
                supportingText={`${metrics.receivables.customerCount} customers with balances`}
                value={metrics.receivables.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
