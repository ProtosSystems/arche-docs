import { type Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/app/providers'

import '@/styles/tailwind.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s - Arche Docs',
    default: 'Arche Docs',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-full bg-[color:var(--docs-bg)] text-[color:var(--docs-text)] antialiased`}
      >
        <Providers>
          <div className="w-full">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
