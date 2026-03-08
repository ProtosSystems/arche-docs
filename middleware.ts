import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  getExpectedAuthToken,
} from './src/lib/access-auth'

const UNPROTECTED_PATHS = new Set(['/access', '/api/access-login'])

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const expectedToken = await getExpectedAuthToken()

  if (expectedToken && !UNPROTECTED_PATHS.has(pathname)) {
    const requestToken = request.cookies.get(AUTH_COOKIE_NAME)?.value

    if (requestToken !== expectedToken) {
      const accessUrl = new URL('/access', request.url)
      accessUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(accessUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|favicon-16x16.png|favicon-32x32.png).*)',
  ],
}
