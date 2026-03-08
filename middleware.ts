import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const AUTH_COOKIE = 'site_auth'

function getAuthToken(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const configuredUsername = process.env.SITE_USERNAME
  const configuredPassword = process.env.SITE_PASSWORD

  if (!configuredUsername || !configuredPassword) {
    return NextResponse.next()
  }

  const publicPaths = new Set(['/access', '/api/access-login'])
  if (publicPaths.has(pathname)) {
    return NextResponse.next()
  }

  const requestToken = request.cookies.get(AUTH_COOKIE)?.value
  const expectedToken = getAuthToken(configuredUsername, configuredPassword)

  if (requestToken !== expectedToken) {
    const accessUrl = new URL('/access', request.url)
    accessUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(accessUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|favicon-16x16.png|favicon-32x32.png).*)',
  ],
}

