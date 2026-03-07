import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { getSiteUrl } from '@/lib/site-url'

import '@/styles/tailwind.css'

const siteUrl = getSiteUrl()
const siteName = 'Arche Documentation'
const siteTitle = 'Arche Documentation'
const siteDescription =
  'Arche API documentation for deterministic, versioned, point-in-time financial fundamentals.'
const socialImagePath = '/arche-og.png'
const socialProfiles = ['https://www.linkedin.com/company/protos-sys/', 'https://x.com/ProtosSystems']
const verification = {
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : {}),
  ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
    ? { yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION }
    : {}),
  ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
    ? {
        other: {
          'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
        },
      }
    : {}),
}

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: 'Arche Docs',
  title: {
    template: '%s - Arche Docs',
    default: 'Arche Docs',
  },
  description: siteDescription,
  category: 'Developer documentation',
  keywords: [
    'Arche API docs',
    'financial fundamentals API',
    'point-in-time data',
    'restatement history',
    'deterministic financial datasets',
    'SEC EDGAR fundamentals',
  ],
  authors: [{ name: 'Protos Systems' }],
  creator: 'Protos Systems',
  publisher: 'Protos Systems',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: '/',
    images: [
      {
        url: socialImagePath,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    site: '@ProtosSystems',
    creator: '@ProtosSystems',
    images: [socialImagePath],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification,
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: [{ url: '/favicon-32x32.png', type: 'image/png' }],
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Arche API',
    url: siteUrl.toString(),
    logo: new URL('/apple-touch-icon.png', siteUrl).toString(),
    sameAs: socialProfiles,
    parentOrganization: {
      '@type': 'Organization',
      name: 'Protos Systems',
      sameAs: socialProfiles,
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl.toString(),
    inLanguage: 'en-US',
    sameAs: socialProfiles,
    publisher: {
      '@type': 'Organization',
      name: 'Protos Systems',
      sameAs: socialProfiles,
    },
  }

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full bg-[color:var(--docs-bg)] text-[color:var(--docs-text)] antialiased"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <Providers>
          <div className="w-full">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
