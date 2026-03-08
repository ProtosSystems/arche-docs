import { NextResponse } from 'next/server'
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  buildAuthToken,
  getConfiguredCredentials,
} from '@/lib/access-auth'

function isSafeInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}

export async function POST(request: Request) {
  const credentials = getConfiguredCredentials()

  if (!credentials) {
    return NextResponse.json({ ok: true, redirectTo: '/' }, { status: 200 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid request payload.' },
      { status: 400 },
    )
  }

  const source = payload as { username?: unknown; password?: unknown; next?: unknown }
  const username =
    typeof source.username === 'string' ? source.username.trim() : ''
  const password =
    typeof source.password === 'string' ? source.password.trim() : ''
  const nextPath =
    typeof source.next === 'string' && isSafeInternalPath(source.next)
      ? source.next
      : '/'

  if (username !== credentials.username || password !== credentials.password) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 401 },
    )
  }

  const response = NextResponse.json({ ok: true, redirectTo: nextPath }, { status: 200 })
  const token = await buildAuthToken(credentials.username, credentials.password)
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })

  return response
}
