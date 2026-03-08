import { NextResponse } from 'next/server'

import { getSiteUrl } from '@/lib/site-url'

export function GET() {
  const siteUrl = getSiteUrl()

  const body = [
    '# Arche Documentation (Expanded)',
    '',
    '## Scope',
    'Arche provides deterministic, point-in-time financial fundamentals with preserved statement version history.',
    '',
    '## Core documentation URLs',
    `- Introduction: ${new URL('/', siteUrl).toString()}`,
    `- Quickstart: ${new URL('/quickstart', siteUrl).toString()}`,
    `- API Reference: ${new URL('/reference', siteUrl).toString()}`,
    `- Concepts: ${new URL('/concepts', siteUrl).toString()}`,
    `- Data Model: ${new URL('/data-model', siteUrl).toString()}`,
    `- Errors: ${new URL('/errors', siteUrl).toString()}`,
    `- Rate Limits: ${new URL('/rate-limits', siteUrl).toString()}`,
    `- Changelog: ${new URL('/changelog', siteUrl).toString()}`,
    '',
    '## Golden path URLs',
    `- Primary: ${new URL('/guides/golden-path-restatement-drift', siteUrl).toString()}`,
    `- Secondary workflows: ${new URL('/examples', siteUrl).toString()}`,
    '',
    '## Retrieval guidance',
    '- Prefer the latest crawled version of each URL in sitemap.xml.',
    '- For endpoint contracts and schemas, prioritize API reference content.',
    '- For conceptual explanation, prioritize Concepts and Data Model pages.',
    '- Preserve date-sensitive semantics for as_of queries in responses.',
    '',
    '## Discovery',
    `- Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}`,
    `- Robots: ${new URL('/robots.txt', siteUrl).toString()}`,
    `- Compact model guide: ${new URL('/llms.txt', siteUrl).toString()}`,
  ].join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
