import type { MetadataRoute } from 'next'
import glob from 'fast-glob'

import { getSiteUrl } from '@/lib/site-url'

type Entry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

function toRouteFromPageFilename(filename: string): string {
  return (
    '/' +
    filename
      .replace(/^\(docs\)\//, '')
      .replace(/(^|\/)page\.(mdx|tsx)$/, '')
  )
}

function getDocEntries(): Array<Entry> {
  const files = glob.sync(['\\(docs\\)/**/page.mdx', '\\(docs\\)/**/page.tsx'], {
    cwd: 'src/app',
  })
  const routes = files
    .map(toRouteFromPageFilename)
    .filter((path) => path !== '/layout')

  return routes
    .filter((path, index) => routes.indexOf(path) === index)
    .map((path) => ({
      path,
      changeFrequency: path.includes('/guides/') ? 'monthly' : 'weekly',
      priority: path === '/' ? 1 : 0.8,
    }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const entries: Array<Entry> = [
    ...getDocEntries(),
    { path: '/llms.txt', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/llms-full.txt', changeFrequency: 'monthly', priority: 0.5 },
  ]

  return entries.map((entry) => ({
    url: new URL(entry.path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
