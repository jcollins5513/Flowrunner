import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}

