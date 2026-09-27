"use server";

import { revalidatePath } from "next/cache";
import { createSession } from "@/lib/auth/session";
import { requireAuthenticatedUser, requireRole } from "@/lib/auth/authorization";
import { businessSlug } from "@/lib/business";
import { query, withTransaction } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import type { ActionResult } from "@/types";
import { validMoney } from "@/lib/pricing";

export interface BusinessChoice { id: number; name: string; setup_complete: boolean; }

export async function getMyBusinesses(): Promise<BusinessChoice[]> {
  const actor = await requireAuthenticatedUser();
  return (await query<BusinessChoice>(
    "SELECT DISTINCT b.id,b.name,b.setup_complete FROM businesses b JOIN user_roles ur ON ur.business_id=b.id WHERE ur.user_id=$1 AND ur.is_active ORDER BY b.id",
    [actor.id])).rows;
}

export async function completeBusinessSetup(nameRaw: string, rateRaw: string): Promise<ActionResult> {
  const name = nameRaw.trim().replace(/\s+/g, " ");
  const rate = Number(rateRaw);
  if (name.length < 2 || name.length > 120) return { error: "Business name must be 2–120 characters." };
  if (!rateRaw.trim() || !validMoney(rate)) return { error: "Enter a valid, non-negative gram rate with up to 2 decimals." };
  try {
    const actor = await requireRole("ADMIN");
    await withTransaction(async (client) => {
      const updated = await client.query(
        "UPDATE businesses SET name=$1,slug=$2,setup_complete=TRUE WHERE id=$3 AND NOT setup_complete RETURNING id",
        [name, businessSlug(name, actor.business_id), actor.business_id]);
      if (!updated.rows[0]) throw new Error("This business has already been set up.");
      await client.query("UPDATE settings SET rate_per_gram=$1,updated_at=now() WHERE business_id=$2", [rate, actor.business_id]);
      await writeAuditLog(client, { userId: actor.id, action: "business.setup", entityType: "business", entityId: actor.business_id, metadata: { name, rate } });
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Business setup failed." }; }
}

export async function switchBusiness(businessId: number): Promise<ActionResult<{ setupComplete: boolean }>> {
  if (!Number.isSafeInteger(businessId) || businessId <= 0) return { error: "Invalid business." };
  try {
    const actor = await requireAuthenticatedUser();
    const selected = (await query<{ setup_complete: boolean; session_version: number }>(
      "SELECT b.setup_complete,u.session_version FROM user_roles ur JOIN businesses b ON b.id=ur.business_id JOIN users u ON u.id=ur.user_id WHERE ur.user_id=$1 AND ur.business_id=$2 AND ur.is_active AND u.is_active LIMIT 1",
      [actor.id, businessId])).rows[0];
    if (!selected) return { error: "You do not have access to that business." };
    await createSession(actor.id, selected.session_version, businessId);
    revalidatePath("/", "layout");
    return { success: true, data: { setupComplete: selected.setup_complete } };
  } catch { return { error: "Could not switch business." }; }
}
