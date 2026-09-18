import { getSessionUser } from "./session";
import { SessionUser } from "@/types";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") { super(message); this.name = "AuthorizationError"; }
}
export function hasPermission(user: SessionUser | null, permission: string): boolean { return Boolean(user?.permissions?.includes(permission)); }
export async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Authentication required.");
  return user;
}
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, permission)) throw new AuthorizationError();
  return user;
}
export async function requireRole(role: string): Promise<SessionUser> {
  const user = await requireAuthenticatedUser();
  if (!user.roles?.includes(role)) throw new AuthorizationError("Required role is missing.");
  return user;
}
