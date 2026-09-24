import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import { Surface } from "@/components/ui/Surface";
import styles from "./dashboard.module.css";

interface MetricCardProps {
  changePercent?: number | null;
  href?: string;
  icon: LucideIcon;
  label: string;
  prefix?: string;
  sensitive?: boolean;
  supportingText: string;
  suffix?: string;
  value: string;
}

function Comparison({ changePercent }: { changePercent: number | null }) {
  if (changePercent === null) {
    return <span className={styles.metricComparison}>No prior activity</span>;
  }

  if (changePercent === 0) {
    return (
      <span className={styles.metricComparison}>
        <Minus size={13} aria-hidden="true" /> No change
      </span>
    );
  }

  const positive = changePercent > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={styles.metricComparison} data-direction={positive ? "up" : "down"}>
      <Icon size={13} aria-hidden="true" />
      {Math.abs(changePercent).toFixed(1)}% vs prior
    </span>
  );
}

export function MetricCard({
  changePercent,
  href,
  icon: Icon,
  label,
  prefix,
  sensitive = false,
  supportingText,
  suffix,
  value,
}: MetricCardProps) {
  const content = (
    <Surface as="article" className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon} aria-hidden="true">
          <Icon size={17} />
        </span>
        <span>{label}</span>
      </div>
      <p className={styles.metricValue}>
        {prefix && <span className={styles.metricAffix}>{prefix}</span>}
        {sensitive ? <PrivacyMask>{value}</PrivacyMask> : value}
        {suffix && <span className={styles.metricAffix}>{suffix}</span>}
      </p>
      <div className={styles.metricFooter}>
        {changePercent !== undefined ? (
          <Comparison changePercent={changePercent} />
        ) : (
          <span className={styles.metricComparison}>{supportingText}</span>
        )}
        {changePercent !== undefined && <span>{supportingText}</span>}
      </div>
    </Surface>
  );

  return href ? (
    <Link className={styles.metricLink} href={href} aria-label={`View ${label.toLowerCase()}`}>
      {content}
    </Link>
  ) : content;
}
