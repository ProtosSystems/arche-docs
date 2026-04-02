import fs from 'node:fs'
import path from 'node:path'

import glob from 'fast-glob'

const root = process.cwd()
const appDir = path.join(root, 'src', 'app')

function routeFromFilename(filename) {
  return (
    '/' +
    filename
      .replace(/^\(docs\)\//, '')
      .replace(/(^|\/)page\.(mdx|tsx)$/, '')
  )
}

async function main() {
  const docsConfig = fs.readFileSync(path.join(root, 'src', 'lib', 'docs.ts'), 'utf8')
  const hrefMatches = Array.from(docsConfig.matchAll(/href:\s*'([^']+)'/g))
  const routesInNav = hrefMatches.map((match) => match[1]).sort()
  const pageFiles = glob.sync(['\\(docs\\)/**/page.mdx', '\\(docs\\)/**/page.tsx'], {
    cwd: appDir,
  })

  const routesOnDisk = pageFiles.map(routeFromFilename).sort()
  const problems = []

  const missingInNav = routesOnDisk.filter((route) => !routesInNav.includes(route))
  const missingOnDisk = routesInNav.filter((route) => !routesOnDisk.includes(route))

  if (missingInNav.length) {
    problems.push(`Routes missing from docs nav: ${missingInNav.join(', ')}`)
  }
  if (missingOnDisk.length) {
    problems.push(`Docs nav routes missing on disk: ${missingOnDisk.join(', ')}`)
  }

  const allowedAbsolute = new Set([
    ...routesOnDisk,
    '/access',
    '/llms.txt',
    '/llms-full.txt',
    '/robots.txt',
    '/sitemap.xml',
    '/apple-touch-icon.png',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
  ])

  const contentFiles = glob.sync(
    [
      'README.md',
      'src/app/\\(docs\\)/**/*.mdx',
      'src/app/**/*.ts',
      'src/app/**/*.tsx',
      'src/components/**/*.tsx',
      'src/lib/**/*.ts',
    ],
    { cwd: root },
  )

  const linkPattern =
    /\]\((\/[^)\s#]+)(?:#[^)]+)?\)|href=["'](\/[^"'\s#]+)(?:#[^"']+)?["']|new URL\(['"](\/[^"'#)]+)(?:#[^"')]+)?['"]/g

  for (const relPath of contentFiles) {
    const text = fs.readFileSync(path.join(root, relPath), 'utf8')
    let match
    while ((match = linkPattern.exec(text))) {
      const target = match[1] || match[2] || match[3]
      if (!target) continue
      if (target.startsWith('/api/')) continue
      if (target.startsWith('/_next/')) continue
      if (!allowedAbsolute.has(target)) {
        problems.push(`Unknown internal link target ${target} in ${relPath}`)
      }
    }
  }

  const staleDocsRefs = contentFiles.filter((relPath) =>
    fs.readFileSync(path.join(root, relPath), 'utf8').includes('/docs/'),
  )
  if (staleDocsRefs.length) {
    problems.push(`Found stale /docs/ references in: ${staleDocsRefs.join(', ')}`)
  }

  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }

  console.log(`Docs integrity check passed for ${routesOnDisk.length} routes.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
