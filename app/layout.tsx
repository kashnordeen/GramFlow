import type { Metadata, Viewport } from 'next'
import './globals.css'
import './workspace.css'

export const viewport: Viewport = {
  themeColor: '#080B0A',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'GramFlow | Inventory and receivables',
  description: 'Inventory, receivables, and accounting in one reliable flow.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/brand-mark.svg', type: 'image/svg+xml' }],
    shortcut: '/brand-mark.svg',
    apple: '/brand-mark.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GramFlow',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('gramflow-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch(e){document.documentElement.dataset.theme='dark'}" }} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
