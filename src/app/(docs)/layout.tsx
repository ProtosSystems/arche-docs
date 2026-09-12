import glob from 'fast-glob'

import { Layout } from '@/components/Layout'
import { type Section } from '@/components/SectionProvider'

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let pages = await glob('\\(docs\\)/**/*.mdx', { cwd: 'src/app' })
  let allSectionsEntries = await Promise.all(
    pages.map(async (filename) => {
      const internalPath =
        '/' +
        filename
          .replace(/^\(docs\)\//, '')
          .replace(/(^|\/)page\.mdx$/, '')
      const sections = (await import(`../${filename}`)).sections as Array<Section>
      return [internalPath, sections] as const
    }),
  )
  let allSections = Object.fromEntries(allSectionsEntries)

  return <Layout allSections={allSections}>{children}</Layout>
}
