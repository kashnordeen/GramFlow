"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Database,
    Users,
    Package,
    Settings,
    Plus,
    Sparkles,
    ChevronLeft,
    Shield,
    BookOpen,
    ScrollText
} from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar({ permissions }: { permissions: string[] }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }, [isCollapsed]);

    const links = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Add Sale", href: "/add-sale", icon: ShoppingCart, permission: "sales.create" },
        { name: "Transactions", href: "/transactions", icon: Database, permission: "sales.read" },
        { name: "Customers", href: "/customers", icon: Users, permission: "customers.read" },
        { name: "Stock Vault", href: "/stock", icon: Package, permission: "inventory.read" },
        { name: "Settings", href: "/settings", icon: Settings, permission: "settings.manage" },
        { name: "Accounting", href: "/accounting", icon: BookOpen, permission: "accounting.read" },
        { name: "Audit Log", href: "/audit", icon: ScrollText, permission: "audit.read" },
        { name: "Access Control", href: "/admin/roles", icon: Shield, permission: "roles.read" },
    ].filter((link) => !link.permission || permissions.includes(link.permission));

    return (
        <>
            {/* Desktop / Tablet Sidebar */}
            <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                    <Link href="/" className="sidebar-brand" style={{ margin: 0, padding: 0 }}>
                        <div className="sidebar-brand-logo">
                            <img src="/logo.png" alt="GramFlow" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="sidebar-brand-text">
                            <h2>GramFlow</h2>
                            <p>Inventory & Loans</p>
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="sidebar-text"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 'var(--radius-sm)'
                        }}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <ChevronLeft size={18} style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                href={link.href}
                                key={link.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                                <span className="sidebar-text">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Stay in Flow Promo Card */}
                <div className="sidebar-footer-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stay in Flow</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                        FIFO inventory tracking active. Real-time batch lineages secured.
                    </p>
                </div>

                <div className="sidebar-text" style={{ paddingTop: '1rem', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    &copy; 2026 GramFlow System
                </div>
            </aside>

            {/* Mobile Bottom Navigation (< 768px) */}
            <nav className="mobile-bottom-nav">
                <Link href="/" className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}>
                    <LayoutDashboard size={22} strokeWidth={pathname === '/' ? 2.5 : 2} />
                    <span>Dashboard</span>
                </Link>

                <Link href="/transactions" className={`mobile-nav-item ${pathname === '/transactions' ? 'active' : ''}`}>
                    <Database size={22} strokeWidth={pathname === '/transactions' ? 2.5 : 2} />
                    <span>History</span>
                </Link>

                {/* Floating Plus CTA */}
                <Link href="/add-sale" className="mobile-floating-plus-btn" aria-label="Record Sale">
                    <Plus size={28} strokeWidth={3} />
                </Link>

                <Link href="/customers" className={`mobile-nav-item ${pathname === '/customers' ? 'active' : ''}`}>
                    <Users size={22} strokeWidth={pathname === '/customers' ? 2.5 : 2} />
                    <span>Customers</span>
                </Link>

                <Link href="/stock" className={`mobile-nav-item ${pathname === '/stock' ? 'active' : ''}`}>
                    <Package size={22} strokeWidth={pathname === '/stock' ? 2.5 : 2} />
                    <span>Stock</span>
                </Link>
            </nav>
        </>
    );
}
