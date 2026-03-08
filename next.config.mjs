import nextMDX from '@next/mdx'

import { recmaPlugins } from './src/mdx/recma.mjs'
import { rehypePlugins } from './src/mdx/rehype.mjs'
import { remarkPlugins } from './src/mdx/remark.mjs'

const withMDX = nextMDX({
  options: {
    remarkPlugins,
    rehypePlugins,
    recmaPlugins,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  outputFileTracingIncludes: {
    '/**/*': ['./src/app/**/*.mdx'],
  },
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/',
        permanent: true,
      },
      {
        source: '/docs/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/docs',
        },
        {
          source:
            '/:slug(quickstart|concepts|data-model|examples|rate-limits|errors|changelog)',
          destination: '/docs/:slug',
        },
        {
          source: '/guides/:path*',
          destination: '/docs/guides/:path*',
        },
        {
          source: '/reference',
          destination: '/docs/reference',
        },
      ],
    }
  },
}

export default withMDX(nextConfig)
