"use server";

import { query, withTransaction } from "../db";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser, requirePermission } from "../auth/authorization";
import { writeAuditLog } from "../audit";
import { Settings, ActionResult } from "@/types";
import { validMoney, validateRanges } from "@/lib/pricing";
import type { RateRange } from "@/types";

export async function getSettings(): Promise<Settings> {
  await requireAuthenticatedUser();
  const [settings, ranges] = await Promise.all([
    query<{ rate_per_gram: number; updated_at: string }>("SELECT rate_per_gram,updated_at FROM settings LIMIT 1"),
    query<RateRange>("SELECT min_grams,max_grams,amount FROM rate_ranges ORDER BY min_grams"),
  ]);
  return { rate_per_gram: settings.rows[0]?.rate_per_gram ?? 0, updated_at: settings.rows[0]?.updated_at, ranges: ranges.rows };
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const rate = Number(formData.get("rate_per_gram"));
  if (!String(formData.get("rate_per_gram") ?? "").trim() || !validMoney(rate)) return { error: "Enter a valid non-negative gram rate." };
  let ranges: RateRange[];
  try {
    const raw: unknown = JSON.parse(String(formData.get("ranges") ?? "[]"));
    if (!Array.isArray(raw) || raw.some((item) => !item || typeof item !== "object" || !["min_grams", "max_grams", "amount"].every((key) => typeof item[key] === "number"))) throw new Error();
    ranges = raw as RateRange[];
  } catch { return { error: "Invalid custom ranges." }; }
  const rangeError = validateRanges(ranges);
  if (rangeError) return { error: rangeError };
  try {
    const actor = await requirePermission("settings.manage");
    await withTransaction(async (client) => {
      const previous = (await client.query<{ rate_per_gram: number }>("SELECT rate_per_gram FROM settings WHERE business_id=$1 FOR UPDATE", [actor.business_id])).rows[0];
      if (!previous) throw new Error("Business settings not found.");
      await client.query("UPDATE settings SET rate_per_gram=$1,updated_at=now() WHERE business_id=$2", [rate, actor.business_id]);
      await client.query("DELETE FROM rate_ranges WHERE business_id=$1", [actor.business_id]);
      for (const range of ranges) await client.query("INSERT INTO rate_ranges(business_id,min_grams,max_grams,amount) VALUES($1,$2,$3,$4)", [actor.business_id, range.min_grams, range.max_grams, range.amount]);
      await writeAuditLog(client, { userId: actor.id, action: "settings.update", entityType: "settings", entityId: actor.business_id, metadata: { previous, current: { rate, ranges } } });
    });
    revalidatePath("/"); revalidatePath("/settings"); revalidatePath("/add-sale"); revalidatePath("/audit");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Settings update failed" }; }
}
