"use client";

import Link from "next/link";
import { ChartNoAxesCombined, EyeOff } from "lucide-react";
import type { DashboardPeriod, DashboardTrendPoint } from "@/types";
import { usePrivacy } from "@/components/PrivacyProvider";
import { getTrendChartModel } from "@/lib/dashboard-chart";
import styles from "./dashboard.module.css";

interface TrendChartProps {
  period: DashboardPeriod;
  points: DashboardTrendPoint[];
}

const currency = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "INR",
});

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function TrendChart({ period, points }: TrendChartProps) {
  const { isVisible } = usePrivacy();
  const model = getTrendChartModel(points);
  const salesPath = model.sales.map((point) => `${point.x},${point.y}`).join(" ");
  const profitPath = model.profit.map((point) => `${point.x},${point.y}`).join(" ");
  const salesTotal = points.reduce((sum, point) => sum + point.sales, 0);
  const profitTotal = points.reduce((sum, point) => sum + point.profit, 0);
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const hasActivity = points.some((point) => point.sales > 0 || point.profit > 0);

  return (
    <section className={styles.trendPanel} aria-labelledby="trend-heading">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}><ChartNoAxesCombined size={15} /> Performance signal</p>
          <h2 id="trend-heading">Sales and gross profit</h2>
        </div>
        <nav className={styles.periodTabs} aria-label="Trend period">
          {[7, 30].map((value) => (
            <Link
              aria-current={period === value ? "page" : undefined}
              className={styles.periodTab}
              href={`/?period=${value}`}
              key={value}
              scroll={false}
            >
              {value}D
            </Link>
          ))}
        </nav>
      </div>

      {!hasActivity ? (
        <div className={styles.panelEmpty}>
          <ChartNoAxesCombined size={26} aria-hidden="true" />
          <h3>Not enough activity to draw a trend</h3>
          <p>Posted sales will appear here on their transaction date.</p>
        </div>
      ) : <>
        <div className={styles.chartLegend} aria-hidden="true">
          <span><i data-series="sales" /> Sales</span>
          <span><i data-series="profit" /> Gross profit</span>
        </div>

        <div className={styles.chartFrame} data-masked={!isVisible}>
        <svg
          className={styles.trendSvg}
          viewBox="0 0 720 260"
          role="img"
          aria-label={isVisible
            ? `${period} day trend. Total sales ${currency.format(salesTotal)} and gross profit ${currency.format(profitTotal)}.`
            : `${period} day trend with values hidden.`}
        >
          {[30, 80, 130, 180, 230].map((y) => (
            <line className={styles.chartGridLine} x1="30" x2="690" y1={y} y2={y} key={y} />
          ))}
          <polyline className={styles.salesLine} points={salesPath} />
          <polyline className={styles.profitLine} points={profitPath} />
          {model.sales.map((point) => (
            <circle
              aria-label={isVisible ? `${shortDate(point.date)} sales ${currency.format(point.value)}` : "Hidden sales value"}
              className={styles.salesPoint}
              cx={point.x}
              cy={point.y}
              key={`sales-${point.date}`}
              r="4"
              role="img"
              tabIndex={0}
            >
              <title>{isVisible ? `${shortDate(point.date)}: ${currency.format(point.value)} sales` : "Hidden value"}</title>
            </circle>
          ))}
          {model.profit.map((point) => (
            <circle
              aria-label={isVisible ? `${shortDate(point.date)} gross profit ${currency.format(point.value)}` : "Hidden profit value"}
              className={styles.profitPoint}
              cx={point.x}
              cy={point.y}
              key={`profit-${point.date}`}
              r="3.5"
              role="img"
              tabIndex={0}
            >
              <title>{isVisible ? `${shortDate(point.date)}: ${currency.format(point.value)} gross profit` : "Hidden value"}</title>
            </circle>
          ))}
        </svg>
        {!isVisible && (
          <div className={styles.chartMask} aria-hidden="true">
            <EyeOff size={18} /> Values hidden
          </div>
        )}
        </div>
        <div className={styles.chartLabels} aria-hidden="true">
          {labelIndexes.map((index) => <span key={points[index].date}>{shortDate(points[index].date)}</span>)}
        </div>
      </>}
    </section>
  );
}
