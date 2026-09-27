import type { RateRange } from "@/types";

export function validMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 999999999999.99 && Math.abs(Math.round(value * 100) - value * 100) < 1e-7;
}

export function grossForGrams(grams: number, ratePerGram: number, ranges: RateRange[]): number {
  return ranges.find((range) => grams >= range.min_grams && grams <= range.max_grams)?.amount ?? Math.round(grams * ratePerGram * 100) / 100;
}

export function validateRanges(ranges: RateRange[]): string | null {
  if (ranges.length > 20) return "You can set up to 20 custom ranges.";
  const ordered = [...ranges].sort((a, b) => a.min_grams - b.min_grams);
  for (let index = 0; index < ordered.length; index++) {
    const { min_grams: min, max_grams: max, amount } = ordered[index];
    if (![min, max].every(Number.isFinite) || min <= 0 || max < min || !validMoney(amount) ||
      min > 99999999999.999 || max > 99999999999.999 ||
      Math.abs(Math.round(min * 1000) - min * 1000) > 1e-7 || Math.abs(Math.round(max * 1000) - max * 1000) > 1e-7) return "Enter valid ranges and amounts (up to 3 decimal places for grams).";
    if (index > 0 && ordered[index - 1].max_grams >= min) return "Custom ranges cannot overlap.";
  }
  return null;
}
