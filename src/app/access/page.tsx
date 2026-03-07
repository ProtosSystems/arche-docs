'use client'

import { useState } from 'react'

type LoginResponse = {
  ok?: boolean
  message?: string
  redirectTo?: string
}

function getNextPath(search: string): string {
  const params = new URLSearchParams(search)
  const next = params.get('next')

  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }

  return next
}

export default function AccessPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const nextPath =
      typeof window !== 'undefined' ? getNextPath(window.location.search) : '/'

    try {
      const response = await fetch('/api/access-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, next: nextPath }),
      })

      const payload = (await response.json().catch(() => null)) as LoginResponse | null

      if (!response.ok || !payload?.ok) {
        setError(payload?.message ?? 'Unable to sign in.')
        return
      }

      window.location.assign(payload.redirectTo || '/')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--docs-bg)] px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[color:var(--docs-text)]">
          Private Access
        </h1>
        <p className="mt-2 text-sm text-[color:var(--docs-muted)]">
          Sign in to view docs.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[color:var(--docs-text)]"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-[color:var(--docs-border)] bg-[color:var(--docs-bg)] px-3 py-2 text-sm text-[color:var(--docs-text)] outline-none focus:border-[color:var(--docs-link)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[color:var(--docs-text)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-[color:var(--docs-border)] bg-[color:var(--docs-bg)] px-3 py-2 text-sm text-[color:var(--docs-text)] outline-none focus:border-[color:var(--docs-link)]"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[color:var(--brand-navy)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

