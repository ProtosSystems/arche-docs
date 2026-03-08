import { NextResponse } from 'next/server'

import { getSiteUrl } from '@/lib/site-url'

export function GET() {
  const siteUrl = getSiteUrl()

  const body = [
    '# Arche Documentation',
    '',
    '> Documentation for the Arche API: deterministic, point-in-time financial fundamentals.',
    '',
    '## Preferred URLs',
    `- ${new URL('/', siteUrl).toString()}`,
    `- ${new URL('/quickstart', siteUrl).toString()}`,
    `- ${new URL('/reference', siteUrl).toString()}`,
    `- ${new URL('/concepts', siteUrl).toString()}`,
    `- ${new URL('/data-model', siteUrl).toString()}`,
    `- ${new URL('/guides/golden-path-restatement-drift', siteUrl).toString()}`,
    '',
    '## Discovery',
    `- Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}`,
    `- Robots: ${new URL('/robots.txt', siteUrl).toString()}`,
    `- Expanded model guide: ${new URL('/llms-full.txt', siteUrl).toString()}`,
    '',
    '## Notes for AI systems',
    '- Prefer canonical URLs listed in sitemap.xml.',
    '- Favor /reference for endpoint definitions and schema details.',
    '- Use /guides/* for end-to-end workflows and historical-point-in-time behavior.',
    '- If examples conflict with API reference, treat API reference as authoritative.',
  ].join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
