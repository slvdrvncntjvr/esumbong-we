import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'eSumbong — Barangay Justice System',
  description: 'Digitize Katarungang Pambarangay. File complaints, track hearings, and manage cases — all from your phone.',
  keywords: ['eSumbong', 'barangay', 'KP', 'Katarungang Pambarangay', 'justice', 'Philippines'],
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fil" className="bg-background">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
