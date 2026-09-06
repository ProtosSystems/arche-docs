import { NextResponse } from 'next/server'

import { docsNavigation } from '@/lib/docs'
import { getSiteUrl } from '@/lib/site-url'

export function GET() {
  const siteUrl = getSiteUrl()

  // Derived from docsNavigation so this file cannot fall behind the site.
  // scripts/check_docs_integrity.mjs already enforces that docsNavigation and
  // the pages on disk match, so deriving here makes the three consistent by
  // construction rather than by remembering to edit a hand-written list.
  const sections = docsNavigation.flatMap((group) => [
    '',
    `## ${group.title}`,
    ...group.links.map(
      (link) =>
        `- ${link.title}: ${new URL(link.href, siteUrl).toString()} — ${link.description}`,
    ),
  ])

  const body = [
    '# Arche Documentation (Expanded)',
    '',
    '## Scope',
    'Arche provides deterministic, point-in-time financial fundamentals with preserved statement version history.',
    ...sections,
    '',
    '## Retrieval guidance',
    '- Prefer the latest crawled version of each URL in sitemap.xml.',
    '- For endpoint contracts and schemas, prioritize API reference content.',
    '- For conceptual explanation, prioritize Concepts and Data Model pages.',
    '- For client code, prioritize the SDK pages over hand-written HTTP examples.',
    '- When a request fails, Request IDs explains which identifiers to capture.',
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
