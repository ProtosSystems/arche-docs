import clsx from 'clsx'
import Link from 'next/link'

import { Feedback } from '@/components/Feedback'
import { Heading } from '@/components/Heading'
import { Prose } from '@/components/Prose'
import { getRelatedDocs } from '@/lib/docs'

export const a = Link
export { Button } from '@/components/Button'
export { Code as code, CodeGroup, Pre as pre } from '@/components/Code'

export function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <article className="flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">{children}</Prose>
      <footer className="mx-auto mt-16 w-full max-w-2xl lg:ml-4 lg:mr-auto lg:max-w-5xl">
        <Feedback />
      </footer>
    </article>
  )
}

export const h2 = function H2(
  props: Omit<React.ComponentPropsWithoutRef<typeof Heading>, 'level'>,
) {
  return <Heading level={2} {...props} />
}

function InfoIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="8" strokeWidth="0" />
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M6.75 7.75h1.5v3.5"
      />
      <circle cx="8" cy="4" r=".5" fill="none" />
    </svg>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-6 flex gap-2.5 rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-4 text-sm/6 text-[color:var(--docs-text)] dark:border-[color:var(--docs-border)] dark:bg-[color:var(--docs-surface)] dark:text-[color:var(--docs-text)] dark:[--tw-prose-links-hover:var(--docs-link)] dark:[--tw-prose-links:var(--docs-link)]">
      <InfoIcon className="mt-1 h-4 w-4 flex-none fill-[color:var(--docs-link)] stroke-white dark:fill-[color:var(--docs-border)] dark:stroke-[color:var(--docs-text)]" />
      <div className="min-w-0 flex-1 [&>*]:text-inherit [&>p]:m-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}

function Callout({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'tip' | 'warning'
}) {
  return (
    <div
      className={clsx(
        'not-prose my-6 flex gap-3 rounded-2xl border p-4 text-sm/6',
        tone === 'neutral' &&
          'border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] text-[color:var(--docs-text)]',
        tone === 'tip' &&
          'border-emerald-200/70 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100',
        tone === 'warning' &&
          'border-amber-200/70 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100',
      )}
    >
      <div className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-current opacity-70" />
      <div className="min-w-0 flex-1 [&>*]:text-inherit [&>p]:m-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}

export function Tip({ children }: { children: React.ReactNode }) {
  return <Callout tone="tip">{children}</Callout>
}

export function Warning({ children }: { children: React.ReactNode }) {
  return <Callout tone="warning">{children}</Callout>
}

export function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {children}
    </div>
  )
}

export function Card({
  href,
  title,
  children,
}: {
  href: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-5 transition hover:border-[color:var(--docs-link)] hover:bg-[color:var(--docs-hover)]"
    >
      <div className="text-sm font-semibold text-[color:var(--docs-text)]">
        {title}
      </div>
      <div className="mt-2 text-sm text-[color:var(--docs-muted)]">{children}</div>
    </Link>
  )
}

export function NextSteps({ currentPath }: { currentPath: string }) {
  const pages = getRelatedDocs(currentPath, 3)

  if (pages.length === 0) {
    return null
  }

  return (
    <div className="not-prose mt-12 rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-5">
      <p className="text-sm font-semibold text-[color:var(--docs-text)]">
        Next steps
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-xl border border-[color:var(--docs-border)] bg-[color:var(--docs-bg)] p-4 transition hover:border-[color:var(--docs-link)] hover:bg-[color:var(--docs-hover)]"
          >
            <p className="text-sm font-semibold text-[color:var(--docs-text)]">
              {page.title}
            </p>
            <p className="mt-1 text-sm text-[color:var(--docs-muted)]">
              {page.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 xl:max-w-none xl:grid-cols-2">
      {children}
    </div>
  )
}

export function Col({
  children,
  sticky = false,
}: {
  children: React.ReactNode
  sticky?: boolean
}) {
  return (
    <div
      className={clsx(
        '[&>:first-child]:mt-0 [&>:last-child]:mb-0',
        sticky && 'xl:sticky xl:top-24',
      )}
    >
      {children}
    </div>
  )
}

export function Properties({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6">
      <ul
        role="list"
        className="m-0 max-w-[calc(var(--container-lg)-(--spacing(8)))] list-none divide-y divide-zinc-900/5 p-0 dark:divide-white/5"
      >
        {children}
      </ul>
    </div>
  )
}

export function Property({
  name,
  children,
  type,
}: {
  name: string
  children: React.ReactNode
  type?: string
}) {
  return (
    <li className="m-0 px-0 py-4 first:pt-0 last:pb-0">
      <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        <dt className="sr-only">Name</dt>
        <dd>
          <code>{name}</code>
        </dd>
        {type && (
          <>
            <dt className="sr-only">Type</dt>
            <dd className="text-xs text-[color:var(--docs-muted)]">{type}</dd>
          </>
        )}
        <dt className="sr-only">Description</dt>
        <dd className="w-full flex-none [&>:first-child]:mt-0 [&>:last-child]:mb-0">
          {children}
        </dd>
      </dl>
    </li>
  )
}
