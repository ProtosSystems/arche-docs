import 'server-only'

import FlexSearch from 'flexsearch'
import glob from 'fast-glob'
import * as fs from 'fs'
import { toString } from 'mdast-util-to-string'
import * as path from 'path'
import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import { filter } from 'unist-util-filter'
import { SKIP, visit } from 'unist-util-visit'
import { slugifyWithCounter } from '@sindresorhus/slugify'

import { resolveOpenApiUrl, resolveServerOpenApiUrl } from '@/lib/openapi'
import { type SearchResult } from '@/lib/search-types'

type Section = [title: string, hash: string | null, content: string[]]
type IndexedDoc = {
  id: string
  url: string
  title: string
  pageTitle?: string
  content: string
}

type EnrichedResultGroup = {
  result: Array<{ doc?: IndexedDoc }>
}

const QUERY_ALIASES: Record<string, string[]> = {
  'api ref': ['api reference', 'reference', 'openapi'],
  'api-reference': ['api reference', 'reference', 'openapi'],
  apiref: ['api reference', 'reference', 'openapi'],
  auth: ['api key', 'authorization', 'quickstart'],
  login: ['sign in', 'authentication'],
  'rate limit': ['rate limits', 'headers'],
  limits: ['rate limits'],
  restatement: ['restatement drift', 'golden path'],
  restatements: ['restatement drift', 'golden path'],
  quickstart: ['getting started', 'api key'],
}

const processor = remark().use(remarkMdx)
const slugify = slugifyWithCounter()

type OpenApiDocument = {
  paths?: Record<string, Record<string, any>>
  tags?: Array<{ name?: string; description?: string }>
  info?: { title?: string; description?: string }
}

let cached: ReturnType<typeof buildIndex> | null = null

function isObjectExpression(node: any) {
  return (
    node.type === 'mdxTextExpression' &&
    node.data?.estree?.body?.[0]?.expression?.type === 'ObjectExpression'
  )
}

function excludeObjectExpressions(tree: any) {
  return filter(tree, (node) => !isObjectExpression(node))
}

function parseSections(mdx: string): Section[] {
  const sections: Section[] = []
  const tree = processor.parse(mdx)

  slugify.reset()
  visit(tree, (node: any) => {
    if (node.type === 'heading' || node.type === 'paragraph') {
      const content = toString(excludeObjectExpressions(node)).trim()
      if (!content) {
        return SKIP
      }

      if (node.type === 'heading' && node.depth <= 2) {
        const hash = node.depth === 1 ? null : slugify(content)
        sections.push([content, hash, []])
      } else {
        sections.at(-1)?.[2].push(content)
      }

      return SKIP
    }
  })

  return sections
}

async function loadOpenApiDocument(): Promise<OpenApiDocument | null> {
  const configuredUrl = resolveOpenApiUrl()

  if (configuredUrl === '/openapi.json') {
    const openApiPath = path.resolve('./public/openapi.json')
    if (!fs.existsSync(openApiPath)) {
      return null
    }

    const raw = fs.readFileSync(openApiPath, 'utf8')
    return JSON.parse(raw) as OpenApiDocument
  }

  try {
    const response = await fetch(resolveServerOpenApiUrl(), {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`OpenAPI fetch failed (${response.status})`)
    }

    return (await response.json()) as OpenApiDocument
  } catch {
    const openApiPath = path.resolve('./public/openapi.json')
    if (!fs.existsSync(openApiPath)) {
      return null
    }

    const raw = fs.readFileSync(openApiPath, 'utf8')
    return JSON.parse(raw) as OpenApiDocument
  }
}

async function buildIndex() {
  function toPublicPath(pathname: string): string {
    if (pathname === '/docs') return '/'
    if (pathname.startsWith('/docs/')) return pathname.replace(/^\/docs/, '')
    return pathname
  }

  const appDir = path.resolve('./src/app')
  const files = glob.sync('docs/**/*.mdx', { cwd: appDir })

  const index = new FlexSearch.Document<IndexedDoc>({
    tokenize: 'full',
    document: {
      id: 'id',
      index: ['title', 'content'],
      store: ['url', 'title', 'pageTitle', 'content'],
    },
    context: {
      resolution: 9,
      depth: 2,
      bidirectional: true,
    },
  })

  for (const file of files) {
    const pageUrl = toPublicPath('/' + file.replace(/(^|\/)page\.mdx$/, ''))
    const mdx = fs.readFileSync(path.join(appDir, file), 'utf8')
    const sections = parseSections(mdx)

    for (const [title, hash, content] of sections) {
      const url = pageUrl + (hash ? `#${hash}` : '')
      index.add({
        id: url,
        url,
        title,
        content: [title, ...content].join('\n'),
        pageTitle: hash ? sections[0]?.[0] : undefined,
      })
    }
  }

  const openApi = await loadOpenApiDocument()
  if (openApi) {
    const tagDescriptions = new Map<string, string>()
    for (const tag of openApi.tags ?? []) {
      if (tag.name) {
        tagDescriptions.set(tag.name, tag.description ?? '')
      }
    }

    index.add({
      id: '/reference#__overview',
      url: '/reference',
      title: 'API Reference',
      pageTitle: 'API Reference',
      content: [openApi.info?.title, openApi.info?.description]
        .filter(Boolean)
        .join('\n'),
    })

    for (const [apiPath, methods] of Object.entries(openApi.paths ?? {})) {
      for (const [method, operation] of Object.entries(methods)) {
        const verb = method.toUpperCase()
        const op = operation as {
          operationId?: string
          summary?: string
          description?: string
          tags?: string[]
        }
        const operationLabel = `${verb} ${apiPath}`
        const slugBase = op.operationId ?? `${method}-${apiPath}`
        const slug = normalize(slugBase).replace(/\s+/g, '-')
        const url = `/reference#${slug}`
        const tags = (op.tags ?? []).filter(Boolean)
        const tagText = tags
          .flatMap((tag) => [tag, tagDescriptions.get(tag) ?? ''])
          .join('\n')

        index.add({
          id: url,
          url,
          title: op.summary?.trim() || operationLabel,
          pageTitle: 'API Reference',
          content: [
            operationLabel,
            op.operationId,
            op.summary,
            op.description,
            tagText,
          ]
            .filter(Boolean)
            .join('\n'),
        })
      }
    }
  }

  return { index }
}

async function getIndex() {
  if (!cached) {
    cached = buildIndex()
  }

  return (await cached).index
}

export async function searchDocs(query: string, limit = 8): Promise<SearchResult[]> {
  const cleanedQuery = normalize(query)
  if (cleanedQuery.length < 2) {
    return []
  }

  const expandedQueries = expandQuery(cleanedQuery)
  const index = await getIndex()
  const raw = expandedQueries.flatMap(
    (candidate) =>
      index.search(candidate, {
        limit: Math.max(limit * 2, 12),
        enrich: true,
        suggest: true,
      }) as EnrichedResultGroup[],
  )

  const normalizedQuery = cleanedQuery
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean)
  const scoredByUrl = new Map<
    string,
    { doc: IndexedDoc; score: number; bestRank: number }
  >()

  raw.forEach((group, groupIndex) => {
    group.result.forEach((item, itemIndex) => {
      const doc = item.doc
      if (!doc) {
        return
      }

      const rank = groupIndex * 100 + itemIndex
      const existing = scoredByUrl.get(doc.url)
      if (!existing) {
        scoredByUrl.set(doc.url, {
          doc,
          score: scoreDoc(doc, normalizedQuery, queryTerms),
          bestRank: rank,
        })
      } else if (rank < existing.bestRank) {
        existing.bestRank = rank
      }
    })
  })

  return Array.from(scoredByUrl.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.bestRank - b.bestRank
    })
    .slice(0, limit)
    .map(({ doc }) => ({
      url: doc.url,
      title: doc.title,
      pageTitle: doc.pageTitle,
    }))
}

function scoreDoc(doc: IndexedDoc, normalizedQuery: string, queryTerms: string[]) {
  const title = normalize(doc.title)
  const pageTitle = normalize(doc.pageTitle ?? '')
  const content = normalize(doc.content)
  const url = normalize(doc.url)
  let score = 0

  if (title === normalizedQuery) score += 200
  if (title.startsWith(normalizedQuery)) score += 120
  if (title.includes(normalizedQuery)) score += 80
  if (pageTitle.includes(normalizedQuery)) score += 24
  if (url.includes(normalizedQuery)) score += 18

  if (isApiReferenceIntent(normalizedQuery) && url.includes('/reference')) {
    score += 140
  }
  if (isRateLimitIntent(normalizedQuery) && url.includes('/rate-limits')) {
    score += 120
  }
  if (
    isRestatementIntent(normalizedQuery) &&
    url.includes('/guides/golden-path-restatement-drift')
  ) {
    score += 120
  }
  if (isQuickstartIntent(normalizedQuery) && url.includes('/quickstart')) {
    score += 100
  }

  for (const term of queryTerms) {
    if (title.includes(term)) score += 25
    else if (titleWordNearMatch(title, term)) score += 18

    if (pageTitle.includes(term)) score += 10
    if (content.includes(term)) score += 6
  }

  return score
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function expandQuery(query: string) {
  const out = new Set<string>([query])

  for (const [phrase, aliases] of Object.entries(QUERY_ALIASES)) {
    if (query.includes(phrase)) {
      for (const alias of aliases) out.add(alias)
    }
  }

  return Array.from(out)
}

function isApiReferenceIntent(query: string) {
  return /(^|\s)(api|reference|openapi|endpoint)(\s|$)/.test(query)
}

function isRateLimitIntent(query: string) {
  return /(^|\s)(rate|limit|limits|quota|header|headers)(\s|$)/.test(query)
}

function isRestatementIntent(query: string) {
  return /(^|\s)(restatement|restatements|drift|backtest)(\s|$)/.test(query)
}

function isQuickstartIntent(query: string) {
  return /(^|\s)(quickstart|getting started|api key|start)(\s|$)/.test(query)
}

function titleWordNearMatch(title: string, term: string) {
  const words = title.split(/[^a-z0-9]+/).filter(Boolean)
  const maxDistance = term.length <= 5 ? 1 : 2
  return words.some((word) => levenshteinDistance(word, term) <= maxDistance)
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = new Array<number>(b.length + 1)
  const curr = new Array<number>(b.length + 1)

  for (let j = 0; j <= b.length; j += 1) prev[j] = j

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      )
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]
  }

  return prev[b.length]
}
