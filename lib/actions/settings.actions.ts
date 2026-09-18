"use server";

import { query, withTransaction } from "../db";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser, requirePermission } from "../auth/authorization";
import { writeAuditLog } from "../audit";
import { Settings, ActionResult } from "@/types";

export async function getSettings(): Promise<Settings> {
  await requireAuthenticatedUser();
  return (await query<Settings>("SELECT * FROM settings WHERE id=1")).rows[0] ?? { rate_per_gram: 1000, special_025_030: 250, special_050_060: 500 };
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const rate = Number(formData.get("rate_per_gram"));
  const special025 = Number(formData.get("special_025_030"));
  const special050 = Number(formData.get("special_050_060"));
  if (![rate, special025, special050].every((value) => Number.isFinite(value) && value >= 0)) return { error: "Pricing values must be valid non-negative numbers." };
  try {
    const actor = await requirePermission("settings.manage");
    await withTransaction(async (client) => {
      const previous = (await client.query<Settings>("SELECT * FROM settings WHERE id=1 FOR UPDATE")).rows[0];
      await client.query("UPDATE settings SET rate_per_gram=$1,special_025_030=$2,special_050_060=$3,updated_at=now() WHERE id=1", [rate, special025, special050]);
      await writeAuditLog(client, { userId: actor.id, action: "settings.update", entityType: "settings", entityId: 1, metadata: { previous, current: { rate, special025, special050 } } });
    });
    revalidatePath("/"); revalidatePath("/settings"); revalidatePath("/add-sale"); revalidatePath("/audit");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Settings update failed" }; }
}
