"use server";

import { query } from "../db";
import { requireAuthenticatedUser } from "../auth/authorization";
import {
  loadDashboardMetrics,
  normalizeDashboardPeriod,
} from "../dashboard";
import type { DashboardMetrics } from "@/types";

export async function getDashboardMetrics(
  periodInput: unknown = 7,
): Promise<DashboardMetrics | { error: string }> {
  try {
    await requireAuthenticatedUser();
    return await loadDashboardMetrics(query, normalizeDashboardPeriod(periodInput));
  } catch {
    return { error: "Could not fetch dashboard metrics." };
  }
}
