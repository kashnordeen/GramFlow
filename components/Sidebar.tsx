"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Users, Package, Menu, X, Database } from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
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
        { name: "Add Sale", href: "/add-sale", icon: ShoppingCart },
        { name: "Transactions", href: "/transactions", icon: Database },
        { name: "Customers", href: "/customers", icon: Users },
        { name: "Stock", href: "/stock", icon: Package },
    ];

    return (
        <>
            <button
                className="btn btn-secondary glass-panel mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ padding: '0 0.25rem', marginBottom: '2.5rem', marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', overflow: 'hidden' }}>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="desktop-toggle-btn"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.4rem', display: 'flex', marginTop: '1px' }}
                    >
                        <Menu size={24} className="text-accent" />
                    </button>
                    <div className="sidebar-text" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <h2 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', whiteSpace: 'nowrap' }}>
                            <img src="/logo.png" alt="GramFlow" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                            GramFlow
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap' }}>Inventory & Loans</p>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link href={link.href} key={link.href} className={`nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                                <span className="sidebar-text">{link.name}</span>
                            </Link>
                        )
                    })}
                </nav>



                <div className="sidebar-text" style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', whiteSpace: 'nowrap' }}>
                    &copy; 2026 GramFlow System
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link href={link.href} key={link.href} className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{link.name}</span>
                        </Link>
                    )
                })}
            </nav>
        </>
    );
}
