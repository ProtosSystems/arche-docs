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
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#eff3f8] px-6 py-12 dark:bg-[#0B1222] lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(58,79,122,0.15),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(27,39,66,0.18),transparent_35%)]" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto inline-flex w-full items-center justify-center gap-0 text-center text-3xl font-normal tracking-tight text-[#0f172a] dark:text-white">
          <span className="mr-0">⍺</span>rche
        </div>
        <h1 className="mt-10 text-center text-2xl/9 font-normal tracking-tight text-[#0f172a] dark:text-white">
          Private Preview Access
        </h1>
        <p className="mt-2 text-center text-sm/6 text-slate-600 dark:text-slate-300">
          This site is temporarily gated while final updates are completed.
        </p>
      </div>

      <div className="relative mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-[#d9e1ec] bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm/6 font-medium text-[#0f172a] dark:text-slate-100"
            >
              Username
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="block w-full rounded-md bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-[#c6d2e3] placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#3A4F7A] dark:bg-white/10 dark:text-white dark:outline-white/10 dark:placeholder:text-slate-400 dark:focus:outline-[#d9e1ec]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm/6 font-medium text-[#0f172a] dark:text-slate-100"
            >
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="block w-full rounded-md bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-[#c6d2e3] placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#3A4F7A] dark:bg-white/10 dark:text-white dark:outline-white/10 dark:placeholder:text-slate-400 dark:focus:outline-[#d9e1ec]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error ? <p className="text-sm/6 text-red-600 dark:text-red-300">{error}</p> : null}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-[#0f172a] px-3 py-2 text-sm/6 font-semibold text-white shadow-xs hover:bg-[#1e293b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f172a]/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
