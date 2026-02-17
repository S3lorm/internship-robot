import React from "react"
import type { Metadata, Viewport } from 'next'
import { Quicksand } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { AnalyticsClient } from '@/components/analytics-client'
import './globals.css'

const quicksand = Quicksand({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand" 
});

export const metadata: Metadata = {
  title: 'RMU Internship Portal | Regional Maritime University',
  description: 'Streamline your internship applications and management at Regional Maritime University. Browse opportunities, submit applications, and track your progress.',
  keywords: ['internship', 'maritime', 'university', 'RMU', 'Ghana', 'student portal'],
  authors: [{ name: 'Regional Maritime University' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
        <AnalyticsClient />
      </body>
    </html>
  )
}
