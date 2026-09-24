import Link from "next/link";
import { ArrowRight, Boxes, Clock3, PackageX } from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./dashboard.module.css";

interface StockHealthPanelProps {
  canViewStock: boolean;
  stock: DashboardMetrics["stock"];
}

export function StockHealthPanel({ canViewStock, stock }: StockHealthPanelProps) {
  return (
    <section className={styles.stockPanel} aria-labelledby="stock-health-heading">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}><Boxes size={15} /> FIFO inventory</p>
          <h2 id="stock-health-heading">Stock health</h2>
        </div>
        <StatusBadge tone={stock.status}>{stock.openBatchCount} open</StatusBadge>
      </div>

      {stock.batches.length === 0 ? (
        <div className={styles.panelEmpty}>
          <PackageX size={26} aria-hidden="true" />
          <h3>No open batches</h3>
          <p>Add inventory before recording the next sale.</p>
          {canViewStock && <Link href="/stock">Open Stock Vault <ArrowRight size={15} /></Link>}
        </div>
      ) : (
        <ol className={styles.batchList}>
          {stock.batches.map((batch, index) => {
            const remainingPercent = Math.max(0, Math.min(100, (batch.remainingGrams / batch.originalGrams) * 100));
            return (
              <li className={styles.batchItem} key={batch.id}>
                <div className={styles.batchTopline}>
                  <span><strong>#{batch.id}</strong> {index === 0 && <em>Next FIFO</em>}</span>
                  <span>{batch.remainingGrams.toFixed(2)}g</span>
                </div>
                <progress
                  aria-label={`${remainingPercent.toFixed(0)} percent of batch ${batch.id} remains`}
                  className={styles.batchTrack}
                  max={100}
                  value={remainingPercent}
                />
                <div className={styles.batchMeta}>
                  <span><Clock3 size={12} /> {batch.ageDays} days old</span>
                  <span>of {batch.originalGrams.toFixed(2)}g</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canViewStock && stock.batches.length > 0 && (
        <Link className={styles.panelLink} href="/stock">
          View Stock Vault <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
