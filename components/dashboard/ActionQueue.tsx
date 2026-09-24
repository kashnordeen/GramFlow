import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, ListChecks, UserRoundSearch } from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { buildDashboardActions } from "@/lib/dashboard-actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./dashboard.module.css";

interface ActionQueueProps {
  metrics: DashboardMetrics;
  permissions: string[];
}

export function ActionQueue({ metrics, permissions }: ActionQueueProps) {
  const actions = buildDashboardActions(
    {
      receivableCustomers: metrics.receivables.customerCount,
      receivableTotal: metrics.receivables.total,
      setup: metrics.setup,
      stockGrams: metrics.stock.totalGrams,
      stockStatus: metrics.stock.status,
    },
    permissions,
  );

  return (
    <section className={styles.queuePanel} aria-labelledby="queue-heading">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}><ListChecks size={15} /> Prioritized work</p>
          <h2 id="queue-heading">Action queue</h2>
        </div>
        <StatusBadge tone={actions.length ? "warning" : "healthy"}>
          {actions.length || "Clear"}
        </StatusBadge>
      </div>

      {actions.length === 0 ? (
        <div className={styles.queueClear}>
          <CheckCircle2 size={28} aria-hidden="true" />
          <h3>Clear runway</h3>
          <p>No urgent setup, stock, or balance review is waiting.</p>
        </div>
      ) : (
        <ol className={styles.actionList}>
          {actions.map((action) => (
            <li className={styles.actionItem} data-tone={action.tone} key={action.key}>
              <span className={styles.actionIcon} aria-hidden="true">
                {action.key === "receivables" ? <UserRoundSearch size={18} /> : <CircleAlert size={18} />}
              </span>
              <div>
                <h3>{action.title}</h3>
                <p>{action.consequence}</p>
              </div>
              {action.actionHref && action.actionLabel ? (
                <Link href={action.actionHref}>
                  {action.actionLabel} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              ) : (
                <span className={styles.actionRestricted}>Administrator action</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
