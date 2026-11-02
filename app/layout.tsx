import type { Metadata, Viewport } from 'next'
import { Onest, Unbounded } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

// Next downloads these at build time, so users never contact Google.
// Both include Russian letters, so Cyrillic text matches the rest of the app.
const unbounded = Unbounded({
  variable: '--font-unbounded',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['600', '700', '800'],
})
const onest = Onest({
  variable: '--font-onest',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['500', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Griot',
  description: 'Know what threatens your money before it hits.',
  icons: { icon: '/icons/favicon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Griot', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef3ec' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1430' },
  ],
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${onest.variable}`}>
      <body>{children}</body>
    </html>
  )
}
