"use client";

import { createContext, useContext } from "react";

const AccessContext = createContext<string[]>([]);

export function AccessProvider({ permissions, children }: { permissions: string[]; children: React.ReactNode }) {
  return <AccessContext.Provider value={permissions}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const permissions = useContext(AccessContext);
  return { permissions, hasPermission: (permission: string) => permissions.includes(permission) };
}
