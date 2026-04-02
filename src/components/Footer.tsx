'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/Button'
import { getPrevNextDocs } from '@/lib/docs'

function PageLink({
  label,
  page,
  previous = false,
}: {
  label: string
  page: { href: string; title: string }
  previous?: boolean
}) {
  return (
    <>
      <Button
        href={page.href}
        aria-label={`${label}: ${page.title}`}
        variant="secondary"
        arrow={previous ? 'left' : 'right'}
      >
        {label}
      </Button>
      <Link
        href={page.href}
        tabIndex={-1}
        aria-hidden="true"
        className="text-base font-semibold text-[color:var(--docs-text)] transition hover:text-[color:var(--docs-link-hover)]"
      >
        {page.title}
      </Link>
    </>
  )
}

function PageNavigation() {
  let pathname = usePathname()
  let { previous: previousPage, next: nextPage } = getPrevNextDocs(pathname)

  if (!previousPage && !nextPage) {
    return null
  }

  return (
    <div className="flex">
      {previousPage && (
        <div className="flex flex-col items-start gap-3">
          <PageLink label="Previous" page={previousPage} previous />
        </div>
      )}
      {nextPage && (
        <div className="ml-auto flex flex-col items-end gap-3">
          <PageLink label="Next" page={nextPage} />
        </div>
      )}
    </div>
  )
}

function SmallPrint() {
  return (
    <div className="flex flex-col items-center justify-between gap-5 border-t border-[color:var(--docs-border)] pt-8 sm:flex-row">
      <p className="text-xs text-[color:var(--docs-muted)]">
        &copy; Copyright {new Date().getFullYear()}. All rights reserved.
      </p>
      <div className="flex gap-4 text-xs text-[color:var(--docs-muted)]">
        <Link
          href="https://x.com/ProtosSystems"
          className="transition hover:text-[color:var(--docs-link-hover)]"
        >
          X
        </Link>
        <Link
          href="https://www.linkedin.com/company/protos-sys/"
          className="transition hover:text-[color:var(--docs-link-hover)]"
        >
          LinkedIn
        </Link>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-2xl space-y-10 pb-16 lg:max-w-5xl">
      <PageNavigation />
      <SmallPrint />
    </footer>
  )
}
