import glob from 'fast-glob'

import { Layout } from '@/components/Layout'
import { type Section } from '@/components/SectionProvider'

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  function toPublicPath(pathname: string): string {
    if (pathname === '/docs') return '/'
    if (pathname.startsWith('/docs/')) return pathname.replace(/^\/docs/, '')
    return pathname
  }

  let pages = await glob('docs/**/*.mdx', { cwd: 'src/app' })
  let allSectionsEntries = (await Promise.all(
    pages.map(async (filename) => {
      const internalPath = '/' + filename.replace(/(^|\/)page\.mdx$/, '')
      const sections = (await import(`../${filename}`)).sections as Array<Section>
      return [
        [internalPath, sections],
        [toPublicPath(internalPath), sections],
      ] as const
    }),
  )) as Array<readonly [readonly [string, Array<Section>], readonly [string, Array<Section>]]>
  let allSections = Object.fromEntries(allSectionsEntries.flat())

  return <Layout allSections={allSections}>{children}</Layout>
}
