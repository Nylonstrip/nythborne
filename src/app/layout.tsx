import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nythborne — World of Astraea',
  description: 'Campaign hub for the Nythborne RPG system set in Astraea.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
