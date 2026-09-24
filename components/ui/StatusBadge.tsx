import type { ReactNode } from "react";

export type StatusTone = "critical" | "healthy" | "info" | "neutral" | "warning";

interface StatusBadgeProps {
  children: ReactNode;
  className?: string;
  tone?: StatusTone;
}

export function StatusBadge({
  children,
  className = "",
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span className={`status-badge ${className}`.trim()} data-status={tone}>
      {children}
    </span>
  );
}
