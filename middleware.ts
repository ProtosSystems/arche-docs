import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const AUTH_COOKIE = 'site_auth'
const PUBLIC_ASSET_PATHS = new Set([
  '/favicon.ico',
  '/site.webmanifest',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
])
const UNPROTECTED_PATHS = new Set(['/access', '/api/access-login'])

function getAuthToken(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

function isPublicFile(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname)
}

function isInternalPath(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (UNPROTECTED_PATHS.has(pathname)) return true
  if (PUBLIC_ASSET_PATHS.has(pathname)) return true
  if (isPublicFile(pathname)) return true
  return false
}

function toPublicPath(pathname: string): string {
  if (pathname === '/docs') return '/'
  if (pathname.startsWith('/docs/')) return pathname.replace(/^\/docs/, '')
  return pathname
}

function toDocsPath(pathname: string): string {
  return pathname === '/' ? '/docs' : `/docs${pathname}`
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = toPublicPath(pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const configuredUsername = process.env.SITE_USERNAME?.trim()
  const configuredPassword = process.env.SITE_PASSWORD?.trim()

  if (
    configuredUsername &&
    configuredPassword &&
    !UNPROTECTED_PATHS.has(pathname) &&
    !isInternalPath(pathname)
  ) {
    const requestToken = request.cookies.get(AUTH_COOKIE)?.value
    const expectedToken = getAuthToken(configuredUsername, configuredPassword)

    if (requestToken !== expectedToken) {
      const accessUrl = new URL('/access', request.url)
      accessUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(accessUrl)
    }
  }

  if (isInternalPath(pathname)) {
    return NextResponse.next()
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = toDocsPath(pathname)
  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|favicon-16x16.png|favicon-32x32.png).*)',
  ],
}
