import { Sidebar } from '@/components/Sidebar'
import { ToastProvider } from '@/components/ToastProvider'
import { PrivacyProvider } from '@/components/PrivacyProvider'
import { TopNav } from '@/components/ui/TopNav'
import { AutoLogout } from '@/components/AutoLogout'
import { getSessionUser } from '@/lib/actions/auth.actions'
import { AccessProvider } from '@/components/AccessProvider'
import { getMyBusinesses } from '@/lib/actions/business.actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser();
    if (!user) redirect('/login');
    if (!user.setup_complete) redirect('/setup');
    const businesses = await getMyBusinesses();

    return (
        <AccessProvider permissions={user?.permissions || []}>
        <PrivacyProvider>
            <ToastProvider />
            <AutoLogout />
            <div className="app-shell">
                <Sidebar permissions={user?.permissions || []} />
                <main className="main-content">
                    <TopNav user={user} businesses={businesses} />
                    <div className="content-container">
                        {children}
                    </div>
                </main>
            </div>
        </PrivacyProvider>
        </AccessProvider>
    )
}
