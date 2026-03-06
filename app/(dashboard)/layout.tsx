import { Sidebar } from '@/components/Sidebar'
import { ToastProvider } from '@/components/ToastProvider'
import { PrivacyProvider } from '@/components/PrivacyProvider'
import { TopNav } from '@/components/ui/TopNav'
import { getSessionUser } from '@/lib/actions/auth.actions'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser();

    return (
        <PrivacyProvider>
            <ToastProvider />
            <Sidebar />
            <main className="main-content" style={{ position: 'relative' }}>
                {user && <TopNav user={user} />}
                <div className="container animate-fade-in" style={{ paddingTop: '5rem' }}>
                    {children}
                </div>
            </main>
        </PrivacyProvider >
    )
}
