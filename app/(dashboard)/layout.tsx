import { Sidebar } from '@/components/Sidebar'
import { ToastProvider } from '@/components/ToastProvider'
import { PrivacyProvider } from '@/components/PrivacyProvider'
import { TopNav } from '@/components/ui/TopNav'
import { AutoLogout } from '@/components/AutoLogout'
import { getSessionUser } from '@/lib/actions/auth.actions'
import { AccessProvider } from '@/components/AccessProvider'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser();

    return (
        <AccessProvider permissions={user?.permissions || []}>
        <PrivacyProvider>
            <ToastProvider />
            <AutoLogout />
            <div className="app-shell">
                <Sidebar permissions={user?.permissions || []} />
                <main className="main-content">
                    {user && <TopNav user={user} />}
                    <div className="content-container">
                        {children}
                    </div>
                </main>
            </div>
        </PrivacyProvider>
        </AccessProvider>
    )
}
