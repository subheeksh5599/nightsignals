import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NightSignals — Privacy-preserving Insight Marketplace',
  description: 'Creators sell trading signals with cryptographic proof. Buyers verify on-chain without content touching the public ledger. Built on Midnight.',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%2308080c"/><circle cx="16" cy="16" r="5" fill="%236C5CE7"/></svg>' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
