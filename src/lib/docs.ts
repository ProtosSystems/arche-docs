import { type Metadata } from 'next'

type DocCategory = 'get-started' | 'core-concepts' | 'guides' | 'api'

export type DocEntry = {
  title: string
  href: string
  description: string
  category: DocCategory
}

export type NavGroup = {
  title: string
  links: DocEntry[]
}

export const docsNavigation: NavGroup[] = [
  {
    title: 'Get started',
    links: [
      {
        title: 'Overview',
        href: '/',
        description:
          'Start here for the product model, first request path, and key entry points.',
        category: 'get-started',
      },
      {
        title: 'Quickstart',
        href: '/quickstart',
        description:
          'Authenticate, resolve a company, retrieve statement versions, and run an as_of query.',
        category: 'get-started',
      },
      {
        title: 'Authentication',
        href: '/authentication',
        description:
          'Send API keys correctly and handle authentication failures.',
        category: 'get-started',
      },
      {
        title: 'Environments',
        href: '/environments',
        description:
          'Base URLs, deployment expectations, and operational environment guidance.',
        category: 'get-started',
      },
    ],
  },
  {
    title: 'Core concepts',
    links: [
      {
        title: 'Concepts',
        href: '/concepts',
        description:
          'Understand point-in-time retrieval, restatements, and deterministic datasets.',
        category: 'core-concepts',
      },
      {
        title: 'Data model',
        href: '/data-model',
        description:
          'Learn how companies, filings, statements, and statement versions relate.',
        category: 'core-concepts',
      },
      {
        title: 'Versioning',
        href: '/versioning',
        description:
          'Work with latest, version history, and as_of semantics without historical drift.',
        category: 'core-concepts',
      },
      {
        title: 'Request & response conventions',
        href: '/request-response-conventions',
        description:
          'Response envelopes, timestamps, nullability, ordering, and field conventions.',
        category: 'core-concepts',
      },
      {
        title: 'Pagination',
        href: '/pagination',
        description:
          'Use page-based collection endpoints predictably and at scale.',
        category: 'core-concepts',
      },
    ],
  },
  {
    title: 'Guides',
    links: [
      {
        title: 'Restatement drift',
        href: '/guides/restatement-drift',
        description:
          'Show how restatements change historical results when data is not queried point-in-time.',
        category: 'guides',
      },
      {
        title: 'Point-in-time research',
        href: '/guides/point-in-time-research',
        description:
          'Build research workflows that preserve historical knowability and reproducibility.',
        category: 'guides',
      },
      {
        title: 'Rebuild a historical view',
        href: '/guides/rebuild-historical-view',
        description:
          'Reconstruct what a company statement looked like on a specific date.',
        category: 'guides',
      },
      {
        title: 'Company resolution and statement retrieval',
        href: '/guides/company-resolution-and-statement-retrieval',
        description:
          'Resolve an issuer, fetch statements, and move from identifier lookup into analysis.',
        category: 'guides',
      },
    ],
  },
  {
    title: 'API',
    links: [
      {
        title: 'API reference',
        href: '/reference',
        description:
          'Browse the live OpenAPI contract rendered from the public schema.',
        category: 'api',
      },
      {
        title: 'Errors',
        href: '/errors',
        description:
          'Interpret machine-readable error responses and troubleshoot failed requests.',
        category: 'api',
      },
      {
        title: 'Rate limits',
        href: '/rate-limits',
        description:
          'Handle request budgets, backoff, and throughput-sensitive integrations.',
        category: 'api',
      },
      {
        title: 'Changelog',
        href: '/changelog',
        description:
          'Track public documentation and API contract changes over time.',
        category: 'api',
      },
    ],
  },
]

export const docsPages = docsNavigation.flatMap((group) => group.links)

export const docsByHref = new Map(docsPages.map((page) => [page.href, page]))

export function getDocByHref(href: string) {
  return docsByHref.get(href)
}

export function getRelatedDocs(href: string, count = 3) {
  const current = docsByHref.get(href)
  if (!current) {
    return docsPages.filter((page) => page.href !== href).slice(0, count)
  }

  const sameCategory = docsPages.filter(
    (page) => page.href !== href && page.category === current.category,
  )
  const fallback = docsPages.filter(
    (page) => page.href !== href && page.category !== current.category,
  )

  return [...sameCategory, ...fallback].slice(0, count)
}

export function getPrevNextDocs(href: string) {
  const index = docsPages.findIndex((page) => page.href === href)
  if (index === -1) {
    return { previous: undefined, next: undefined }
  }

  return {
    previous: docsPages[index - 1],
    next: docsPages[index + 1],
  }
}

export function createDocMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
    },
    twitter: {
      title,
      description,
    },
  }
}
