import type { DashboardTrendPoint } from "@/types";

export interface TrendCoordinate {
  date: string;
  value: number;
  x: number;
  y: number;
}

export interface TrendChartModel {
  maxValue: number;
  profit: TrendCoordinate[];
  sales: TrendCoordinate[];
}

export function getTrendChartModel(
  points: DashboardTrendPoint[],
  width = 720,
  height = 260,
  padding = 30,
): TrendChartModel {
  const maxValue = Math.max(1, ...points.flatMap((point) => [point.sales, point.profit]));
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;
  const xForIndex = (index: number) =>
    points.length <= 1 ? width / 2 : padding + (index / (points.length - 1)) * drawableWidth;
  const yForValue = (value: number) => padding + (1 - value / maxValue) * drawableHeight;

  return {
    maxValue,
    sales: points.map((point, index) => ({
      date: point.date,
      value: point.sales,
      x: xForIndex(index),
      y: yForValue(point.sales),
    })),
    profit: points.map((point, index) => ({
      date: point.date,
      value: point.profit,
      x: xForIndex(index),
      y: yForValue(point.profit),
    })),
  };
}
