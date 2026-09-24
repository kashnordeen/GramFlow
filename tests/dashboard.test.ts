import test from "node:test";
import assert from "node:assert/strict";
import {
  getDashboardDataState,
  getStockStatus,
  normalizeDashboardPeriod,
  percentageChange,
} from "../lib/dashboard";
import { getTrendChartModel } from "../lib/dashboard-chart";

test("dashboard period accepts only the supported 7 and 30 day ranges", () => {
  assert.equal(normalizeDashboardPeriod("30"), 30);
  assert.equal(normalizeDashboardPeriod(7), 7);
  assert.equal(normalizeDashboardPeriod("365"), 7);
  assert.equal(normalizeDashboardPeriod(undefined), 7);
});

test("percentage comparison avoids inventing a percentage from a zero baseline", () => {
  assert.equal(percentageChange(150, 100), 50);
  assert.equal(percentageChange(75, 100), -25);
  assert.equal(percentageChange(0, 0), 0);
  assert.equal(percentageChange(10, 0), null);
});

test("stock status follows the existing five gram warning threshold", () => {
  assert.equal(getStockStatus(0), "critical");
  assert.equal(getStockStatus(4.999), "warning");
  assert.equal(getStockStatus(5), "healthy");
});

test("dashboard state preserves useful partial data", () => {
  assert.equal(
    getDashboardDataState({ hasCustomers: false, hasSales: false, hasStock: false }),
    "empty",
  );
  assert.equal(
    getDashboardDataState({ hasCustomers: true, hasSales: false, hasStock: false }),
    "partial",
  );
  assert.equal(
    getDashboardDataState({ hasCustomers: true, hasSales: true, hasStock: true }),
    "ready",
  );
});

test("trend chart geometry preserves point order and handles a zero series", () => {
  const model = getTrendChartModel([
    { date: "2026-09-23", profit: 0, sales: 0 },
    { date: "2026-09-24", profit: 25, sales: 100 },
  ]);

  assert.equal(model.sales.length, 2);
  assert.equal(model.profit.length, 2);
  assert.equal(model.sales[0].x, model.profit[0].x);
  assert.ok(model.sales[1].y < model.profit[1].y);
  assert.equal(model.maxValue, 100);
});
