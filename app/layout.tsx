import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import './library-features.css'

export const metadata: Metadata = {
  title: 'Smart Library — Campus Resource Library',
  description: 'Find teacher-prioritized lecture notes, study guides, past papers, and course resources in one campus library.',
  applicationName: 'Smart Library',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#f7f8f5',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = (await cookies()).get('theme')?.value === 'dark' ? 'dark' : 'light'
  return <html lang="en" data-theme={theme}><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
