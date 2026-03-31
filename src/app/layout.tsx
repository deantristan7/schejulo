import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Schejulo',
  description: 'Schedule maker untuk live host e-commerce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <PostHogProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </PostHogProvider>
      </body>
    </html>
  )
}
