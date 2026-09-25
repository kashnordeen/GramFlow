import type { QueryResult, QueryResultRow } from "pg";
import type { StockBatch } from "@/types";
import { query } from "./db";

type StockQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: readonly unknown[],
) => Promise<QueryResult<T>>;

export function parseTotalCost(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const cost = Number(value);
  return Number.isFinite(cost) ? cost : null;
}

export function parseBatchReceipt(formData: FormData):
  | { grams: number; totalCost: number }
  | { error: string } {
  const gramsInput = formData.get("grams");
  const costInput = formData.get("total_cost");
  const grams = Number(gramsInput);
  const totalCost = parseTotalCost(costInput);

  if (typeof gramsInput !== "string" || !gramsInput.trim() || !Number.isFinite(grams) || grams <= 0) {
    return { error: "Invalid grams amount" };
  }
  if (totalCost === null || totalCost <= 0) {
    return { error: "Enter a valid total batch cost." };
  }
  return { grams, totalCost };
}

export async function loadStockBatches(runQuery: StockQuery = query): Promise<StockBatch[]> {
  return (await runQuery<StockBatch>(`
    SELECT sb.*,
      COALESCE(SUM(CASE WHEN s.status='POSTED' THEN a.grams_deducted*a.unit_cost ELSE 0 END),0) AS realized_cost,
      COALESCE(SUM(CASE WHEN s.status='POSTED' THEN a.grams_deducted*(s.final_amount/NULLIF(s.grams_sold,0)) ELSE 0 END),0) AS total_revenue
    FROM stock_batches sb LEFT JOIN sale_batch_assignments a ON a.batch_id=sb.id LEFT JOIN sales s ON s.id=a.sale_id
    GROUP BY sb.id ORDER BY sb.created_at DESC,sb.id DESC`)).rows;
}
