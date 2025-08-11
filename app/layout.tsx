import './globals.css'
import type { Metadata } from 'next'
import ThemeToggle from './ThemeToggle'

export const metadata: Metadata = {
  title: 'VoteTrace — Civic transparency for everyone',
  description: 'See all your representatives at every level of government with votes, bills, and donations — in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-brand-50 to-white text-gray-900 antialiased dark:from-gray-900 dark:to-black dark:text-gray-100">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}


