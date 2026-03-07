import { NextResponse } from 'next/server'

import { searchDocs } from '@/lib/search'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const requestedLimit = Number(searchParams.get('limit') ?? '8')
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 20)
    : 8

  const results = searchDocs(query, limit)

  return NextResponse.json(
    { results },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    },
  )
}
