import type { Metadata, Viewport } from 'next'
import { Baloo_2, Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

// Next downloads these at build time, so users never contact Google.
const baloo = Baloo_2({ variable: '--font-baloo', subsets: ['latin'], weight: ['600', '700', '800'] })
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'latin-ext'],
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
    <html lang="en" className={`${baloo.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  )
}
