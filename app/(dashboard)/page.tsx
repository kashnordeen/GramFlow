import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CircleGauge } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import styles from "@/components/dashboard/dashboard.module.css";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Surface } from "@/components/ui/Surface";
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
        <span className={styles.contextPill}>
          <span className={styles.contextDot} aria-hidden="true" />
          Live data · {period} day view
        </span>
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

          <section className={styles.dataPreviewGrid} aria-label="Available business data">
            <Surface as="article" className={styles.dataPreview}>
              <div className={styles.dataPreviewTop}>
                <h2>Inventory signal</h2>
                <StatusBadge tone={metrics.stock.status}>{metrics.stock.status}</StatusBadge>
              </div>
              {metrics.setup.hasStock ? (
                <p className={styles.previewValue}>{metrics.stock.totalGrams.toFixed(2)}g</p>
              ) : (
                <p className={styles.previewEmpty}>No open stock batch yet.</p>
              )}
            </Surface>
            <Surface as="article" className={styles.dataPreview}>
              <div className={styles.dataPreviewTop}>
                <h2>Sales signal</h2>
                <CircleGauge size={18} aria-hidden="true" />
              </div>
              {metrics.setup.hasSales ? (
                <p className={styles.previewValue}>{metrics.salesToday.count} today</p>
              ) : (
                <p className={styles.previewEmpty}>No posted sales to chart yet.</p>
              )}
            </Surface>
            <Surface as="article" className={styles.dataPreview}>
              <div className={styles.dataPreviewTop}>
                <h2>Customer signal</h2>
                <StatusBadge tone="neutral">Balance book</StatusBadge>
              </div>
              {metrics.setup.hasCustomers ? (
                <p className={styles.previewValue}>{metrics.receivables.customerCount} active</p>
              ) : (
                <p className={styles.previewEmpty}>No customer profiles yet.</p>
              )}
            </Surface>
          </section>
        </>
      )}
    </div>
  );
}
