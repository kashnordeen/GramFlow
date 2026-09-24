import Link from "next/link";
import { ArrowRight, History, ReceiptText } from "lucide-react";
import type { Sale } from "@/types";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import styles from "./dashboard.module.css";

interface RecentActivityProps {
  canViewTransactions: boolean;
  sales: Sale[];
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

export function RecentActivity({ canViewTransactions, sales }: RecentActivityProps) {
  return (
    <section className={styles.activityPanel} aria-labelledby="activity-heading">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}><History size={15} /> Latest ledger events</p>
          <h2 id="activity-heading">Recent sales</h2>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className={styles.panelEmpty}>
          <ReceiptText size={26} aria-hidden="true" />
          <h3>No posted sales yet</h3>
          <p>Completed transactions will form a chronological activity trail.</p>
        </div>
      ) : (
        <ol className={styles.activityList}>
          {sales.map((sale) => (
            <li className={styles.activityItem} key={sale.id}>
              <span className={styles.activityMark} aria-hidden="true" />
              <div className={styles.activityCopy}>
                <div>
                  <h3>{sale.customer_name}</h3>
                  <time dateTime={sale.created_at}>{formatTimestamp(sale.created_at)}</time>
                </div>
                <div className={styles.activityAmounts}>
                  <strong><PrivacyMask>₹{sale.final_amount.toLocaleString("en-IN")}</PrivacyMask></strong>
                  <span><PrivacyMask>{sale.grams_sold.toFixed(2)}g</PrivacyMask></span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canViewTransactions && sales.length > 0 && (
        <Link className={styles.panelLink} href="/transactions">
          View all transactions <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
