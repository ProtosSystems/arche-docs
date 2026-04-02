import glob from 'fast-glob'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Layout } from '@/components/Layout'
import { type Section } from '@/components/SectionProvider'
import { AUTH_COOKIE_NAME, getExpectedAuthToken } from '@/lib/access-auth'

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const expectedToken = await getExpectedAuthToken()

  if (expectedToken) {
    const cookieStore = await cookies()
    const requestToken = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (requestToken !== expectedToken) {
      redirect('/access')
    }
  }

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
