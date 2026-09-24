import {
  BookOpen,
  Database,
  FileClock,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavigationIcon } from "./navigation";

const icons: Record<NavigationIcon, LucideIcon> = {
  accounting: BookOpen,
  audit: FileClock,
  customers: Users,
  dashboard: LayoutDashboard,
  roles: Shield,
  sale: ShoppingCart,
  settings: Settings,
  stock: Package,
  transactions: Database,
};

export function NavigationGlyph({ icon, size = 19 }: { icon: NavigationIcon; size?: number }) {
  const Icon = icons[icon];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.85} />;
}
