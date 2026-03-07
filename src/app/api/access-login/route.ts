import { NextResponse } from 'next/server'

const AUTH_COOKIE = 'site_auth'

function isSafeInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}

function getAuthToken(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

export async function POST(request: Request) {
  const configuredUsername = process.env.SITE_USERNAME
  const configuredPassword = process.env.SITE_PASSWORD

  if (!configuredUsername || !configuredPassword) {
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
  const username = typeof source.username === 'string' ? source.username : ''
  const password = typeof source.password === 'string' ? source.password : ''
  const nextPath =
    typeof source.next === 'string' && isSafeInternalPath(source.next)
      ? source.next
      : '/'

  if (username !== configuredUsername || password !== configuredPassword) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 401 },
    )
  }

  const response = NextResponse.json({ ok: true, redirectTo: nextPath }, { status: 200 })
  response.cookies.set({
    name: AUTH_COOKIE,
    value: getAuthToken(configuredUsername, configuredPassword),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}

