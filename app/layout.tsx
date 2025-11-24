import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from './providers'

export const metadata: Metadata = {
  title: 'FlowRunner - AI-Driven UI Flow Generator',
  description: 'Transform natural language prompts into multi-screen, fully illustrated UI flows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

