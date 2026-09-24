import type { QueryResult, QueryResultRow } from "pg";
import type {
  Customer,
  DashboardMetrics,
  DashboardPeriod,
  DashboardStockBatch,
  DashboardStockStatus,
  DashboardTrendPoint,
  Sale,
} from "@/types";

export type DashboardQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: readonly unknown[],
) => Promise<QueryResult<T>>;

export function normalizeDashboardPeriod(value: unknown): DashboardPeriod {
  return value === 30 || value === "30" ? 30 : 7;
}

export function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function getStockStatus(totalGrams: number): DashboardStockStatus {
  if (totalGrams <= 0) return "critical";
  if (totalGrams < 5) return "warning";
  return "healthy";
}

interface StockSummaryRow extends QueryResultRow {
  oldest_age_days: number;
  open_batch_count: number;
  total_grams: number;
}

interface StockBatchRow extends QueryResultRow {
  age_days: number;
  created_at: string;
  grams: number;
  id: number;
  remaining_grams: number;
}

interface SalesTodayRow extends QueryResultRow {
  amount: number;
  count: number;
  grams: number;
  previous_amount: number;
}

interface ProfitRow extends QueryResultRow {
  amount: number;
  previous_amount: number;
  revenue: number;
}

interface ReceivableSummaryRow extends QueryResultRow {
  customer_count: number;
  total: number;
}

interface SetupRow extends QueryResultRow {
  customer_count: number;
  sale_count: number;
}

export async function loadDashboardMetrics(
  runQuery: DashboardQuery,
  period: DashboardPeriod,
): Promise<DashboardMetrics> {
  const [
    stockSummaryResult,
    stockBatchesResult,
    salesTodayResult,
    profitResult,
    trendResult,
    receivableSummaryResult,
    debtorsResult,
    recentSalesResult,
    setupResult,
  ] = await Promise.all([
    runQuery<StockSummaryRow>(`
      SELECT
        COALESCE(sum(remaining_grams), 0) AS total_grams,
        count(*)::int AS open_batch_count,
        COALESCE(floor(extract(epoch FROM (now() - min(created_at))) / 86400), 0)::int AS oldest_age_days
      FROM stock_batches
      WHERE status = 'OPEN' AND remaining_grams > 0
    `),
    runQuery<StockBatchRow>(`
      SELECT
        id,
        grams,
        remaining_grams,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        floor(extract(epoch FROM (now() - created_at)) / 86400)::int AS age_days
      FROM stock_batches
      WHERE status = 'OPEN' AND remaining_grams > 0
      ORDER BY created_at, id
      LIMIT 6
    `),
    runQuery<SalesTodayRow>(`
      SELECT
        count(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS count,
        COALESCE(sum(grams_sold) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS grams,
        COALESCE(sum(final_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS amount,
        COALESCE(sum(final_amount) FILTER (
          WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND created_at < CURRENT_DATE
        ), 0) AS previous_amount
      FROM sales
      WHERE status = 'POSTED' AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    `),
    runQuery<ProfitRow>(`
      WITH sale_costs AS (
        SELECT sale_id, sum(grams_deducted * unit_cost) AS cost
        FROM sale_batch_assignments
        GROUP BY sale_id
      )
      SELECT
        COALESCE(sum(s.final_amount - COALESCE(sc.cost, 0)) FILTER (
          WHERE s.created_at >= CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day')
        ), 0) AS amount,
        COALESCE(sum(s.final_amount) FILTER (
          WHERE s.created_at >= CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day')
        ), 0) AS revenue,
        COALESCE(sum(s.final_amount - COALESCE(sc.cost, 0)) FILTER (
          WHERE s.created_at >= CURRENT_DATE - (((2 * $1::int) - 1) * INTERVAL '1 day')
            AND s.created_at < CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day')
        ), 0) AS previous_amount
      FROM sales s
      LEFT JOIN sale_costs sc ON sc.sale_id = s.id
      WHERE s.status = 'POSTED'
        AND s.created_at >= CURRENT_DATE - (((2 * $1::int) - 1) * INTERVAL '1 day')
    `, [period]),
    runQuery<DashboardTrendPoint>(`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day'),
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day
      ),
      sale_costs AS (
        SELECT sale_id, sum(grams_deducted * unit_cost) AS cost
        FROM sale_batch_assignments
        GROUP BY sale_id
      ),
      daily AS (
        SELECT
          s.created_at::date AS day,
          sum(s.final_amount) AS sales,
          sum(s.final_amount - COALESCE(sc.cost, 0)) AS profit
        FROM sales s
        LEFT JOIN sale_costs sc ON sc.sale_id = s.id
        WHERE s.status = 'POSTED'
          AND s.created_at >= CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day')
        GROUP BY s.created_at::date
      )
      SELECT
        to_char(days.day, 'YYYY-MM-DD') AS date,
        COALESCE(daily.sales, 0) AS sales,
        COALESCE(daily.profit, 0) AS profit
      FROM days
      LEFT JOIN daily ON daily.day = days.day
      ORDER BY days.day
    `, [period]),
    runQuery<ReceivableSummaryRow>(`
      SELECT
        COALESCE(sum(total_loan + old_loan), 0) AS total,
        count(*) FILTER (WHERE total_loan + old_loan > 0)::int AS customer_count
      FROM customers
    `),
    runQuery<Customer>(`
      SELECT *
      FROM customers
      WHERE total_loan + old_loan > 0
      ORDER BY total_loan + old_loan DESC, id
      LIMIT 6
    `),
    runQuery<Sale>(`
      SELECT s.*, c.name AS customer_name
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      WHERE s.status = 'POSTED'
      ORDER BY s.created_at DESC
      LIMIT 6
    `),
    runQuery<SetupRow>(`
      SELECT
        (SELECT count(*)::int FROM customers) AS customer_count,
        (SELECT count(*)::int FROM sales WHERE status = 'POSTED') AS sale_count
    `),
  ]);

  const stockSummary = stockSummaryResult.rows[0];
  const salesToday = salesTodayResult.rows[0];
  const profit = profitResult.rows[0];
  const receivables = receivableSummaryResult.rows[0];
  const setup = setupResult.rows[0];
  const totalStock = Number(stockSummary.total_grams);
  const profitAmount = Number(profit.amount);
  const revenue = Number(profit.revenue);

  return {
    period,
    salesToday: {
      count: Number(salesToday.count),
      grams: Number(salesToday.grams),
      amount: Number(salesToday.amount),
      previousAmount: Number(salesToday.previous_amount),
      changePercent: percentageChange(Number(salesToday.amount), Number(salesToday.previous_amount)),
    },
    grossProfit: {
      amount: profitAmount,
      previousAmount: Number(profit.previous_amount),
      changePercent: percentageChange(profitAmount, Number(profit.previous_amount)),
      marginPercent: revenue === 0 ? null : Math.round((profitAmount / revenue) * 1000) / 10,
      revenue,
    },
    stock: {
      batches: stockBatchesResult.rows.map<DashboardStockBatch>((batch) => ({
        id: Number(batch.id),
        originalGrams: Number(batch.grams),
        remainingGrams: Number(batch.remaining_grams),
        createdAt: batch.created_at,
        ageDays: Number(batch.age_days),
      })),
      oldestBatchAgeDays: Number(stockSummary.oldest_age_days),
      openBatchCount: Number(stockSummary.open_batch_count),
      status: getStockStatus(totalStock),
      totalGrams: totalStock,
    },
    receivables: {
      customerCount: Number(receivables.customer_count),
      prioritizedCustomers: debtorsResult.rows,
      total: Number(receivables.total),
    },
    trend: trendResult.rows.map((point) => ({
      date: point.date,
      profit: Number(point.profit),
      sales: Number(point.sales),
    })),
    recentSales: recentSalesResult.rows,
    setup: {
      hasCustomers: Number(setup.customer_count) > 0,
      hasSales: Number(setup.sale_count) > 0,
      hasStock: totalStock > 0,
    },
  };
}
