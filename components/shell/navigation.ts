export type NavigationIcon =
  | "accounting"
  | "audit"
  | "customers"
  | "dashboard"
  | "roles"
  | "sale"
  | "settings"
  | "stock"
  | "transactions";

export interface NavigationItem {
  href: string;
  icon: NavigationIcon;
  label: string;
  permission?: string;
}

export interface NavigationGroup {
  items: NavigationItem[];
  label: "Control" | "Operate" | "System";
}

const navigationGroups: NavigationGroup[] = [
  {
    label: "Operate",
    items: [
      { label: "Dashboard", href: "/", icon: "dashboard" },
      { label: "Record sale", href: "/add-sale", icon: "sale", permission: "sales.create" },
      { label: "Transactions", href: "/transactions", icon: "transactions", permission: "sales.read" },
      { label: "Customers", href: "/customers", icon: "customers", permission: "customers.read" },
      { label: "Stock vault", href: "/stock", icon: "stock", permission: "inventory.read" },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Accounting", href: "/accounting", icon: "accounting", permission: "accounting.read" },
      { label: "Audit log", href: "/audit", icon: "audit", permission: "audit.read" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: "settings", permission: "settings.manage" },
      { label: "Access control", href: "/admin/roles", icon: "roles", permission: "roles.read" },
    ],
  },
];

export function getNavigationGroups(permissions: string[]): NavigationGroup[] {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || permissions.includes(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getAllowedNavigationItems(permissions: string[]): NavigationItem[] {
  return getNavigationGroups(permissions).flatMap((group) => group.items);
}

export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
