import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";

const accountTemplates = [
  ["1000", "Cash", "ASSET"], ["1010", "Bank", "ASSET"],
  ["1100", "Accounts Receivable", "ASSET"], ["1200", "Inventory", "ASSET"],
  ["3000", "Opening Balance Equity", "EQUITY"], ["4000", "Sales Revenue", "REVENUE"],
  ["5000", "Cost of Goods Sold", "EXPENSE"], ["5100", "Inventory Loss", "EXPENSE"],
];

export async function createBusinessForOwner(client: PoolClient, userId: number): Promise<number> {
  const slug = `business-${randomBytes(8).toString("hex")}`;
  const business = await client.query<{ id: number }>(
    "INSERT INTO businesses(name,slug) VALUES('New business',$1) RETURNING id", [slug]);
  const businessId = business.rows[0].id;
  await client.query("SELECT set_config('app.business_id',$1,true)", [String(businessId)]);
  await client.query(
    "INSERT INTO user_roles(user_id,role_id,business_id) SELECT $1,id,$2 FROM roles WHERE name='ADMIN'",
    [userId, businessId]);
  await client.query("INSERT INTO settings(business_id,rate_per_gram,special_025_030,special_050_060) VALUES($1,0,0,0)", [businessId]);
  for (const [code, name, type] of accountTemplates) {
    await client.query(
      "INSERT INTO accounts(business_id,account_code,account_name,account_type) VALUES($1,$2,$3,$4)",
      [businessId, code, name, type]);
  }
  return businessId;
}

export function businessSlug(name: string, businessId: number): string {
  const prefix = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "") || "business";
  return `${prefix}-${businessId}`;
}
