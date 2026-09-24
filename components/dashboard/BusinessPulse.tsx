"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Boxes, CircleAlert, ShieldCheck } from "lucide-react";
import type { DashboardStockStatus } from "@/types";
import { PrivacyMask } from "@/components/ui/PrivacyMask";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./dashboard.module.css";

interface BusinessPulseProps {
  canAddStock: boolean;
  oldestBatchAgeDays: number;
  openBatchCount: number;
  status: DashboardStockStatus;
  totalGrams: number;
}

const statusCopy = {
  critical: { detail: "Sales are blocked until inventory is replenished.", label: "Out of stock" },
  healthy: { detail: "Inventory is ready for the next transaction.", label: "Healthy" },
  warning: { detail: "Replenish soon to keep sales moving.", label: "Low stock" },
} as const;

export function BusinessPulse({
  canAddStock,
  oldestBatchAgeDays,
  openBatchCount,
  status,
  totalGrams,
}: BusinessPulseProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const copy = statusCopy[status];
  const StatusIcon = status === "healthy" ? ShieldCheck : CircleAlert;

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
    const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -5;
    visualRef.current?.style.setProperty("--pulse-rx", `${rotateX.toFixed(2)}deg`);
    visualRef.current?.style.setProperty("--pulse-ry", `${rotateY.toFixed(2)}deg`);
  }

  function resetDepth() {
    visualRef.current?.style.setProperty("--pulse-rx", "0deg");
    visualRef.current?.style.setProperty("--pulse-ry", "0deg");
  }

  return (
    <article
      className={styles.businessPulse}
      data-status={status}
      onPointerLeave={resetDepth}
      onPointerMove={handlePointerMove}
    >
      <div className={styles.pulseCopy}>
        <div className={styles.pulseHeading}>
          <span className={styles.pulseKicker}><Boxes size={15} /> Inventory pulse</span>
          <StatusBadge tone={status}>
            <StatusIcon size={13} aria-hidden="true" /> {copy.label}
          </StatusBadge>
        </div>
        <p className={styles.pulseValue}>
          <PrivacyMask>{totalGrams.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</PrivacyMask>
          <span>g</span>
        </p>
        <p className={styles.pulseDetail}>{copy.detail}</p>
        <dl className={styles.pulseFacts}>
          <div><dt>Open batches</dt><dd>{openBatchCount}</dd></div>
          <div><dt>Oldest batch</dt><dd>{oldestBatchAgeDays}d</dd></div>
        </dl>
        {status !== "healthy" && canAddStock && (
          <Link className={styles.pulseAction} href="/stock">
            Add stock <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className={styles.vaultScene} ref={visualRef} aria-hidden="true">
        <div className={styles.vaultHalo} />
        <svg className={styles.vaultVisual} viewBox="0 0 330 280" fill="none">
          <path className={styles.vaultOrbit} d="M45 158c17-63 80-109 148-100 55 8 96 48 104 98" />
          <path className={styles.vaultOrbitMuted} d="M28 180c45 55 127 75 194 44 35-16 61-42 78-73" />
          <g className={styles.vaultRear}>
            <path d="m166 40 92 53v105l-92 53-92-53V93l92-53Z" />
            <path d="m166 40 92 53-92 54-92-54 92-53Z" />
          </g>
          <g className={styles.vaultCore}>
            <path d="m166 78 58 34v68l-58 34-59-34v-68l59-34Z" />
            <path d="m166 78 58 34-58 34-59-34 59-34Z" />
            <path d="m107 112 59 34v68l-59-34v-68Z" />
            <path d="m224 112-58 34v68l58-34v-68Z" />
          </g>
          <g className={styles.vaultDoor}>
            <rect x="132" y="119" width="68" height="79" rx="8" />
            <circle cx="166" cy="158" r="15" />
            <path d="M166 143v30M151 158h30" />
          </g>
          <circle className={styles.vaultNode} cx="45" cy="158" r="5" />
          <circle className={styles.vaultNode} cx="297" cy="156" r="5" />
        </svg>
      </div>
    </article>
  );
}
