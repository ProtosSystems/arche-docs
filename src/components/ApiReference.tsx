'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Prose } from '@/components/Prose'

type LoadState = 'loading' | 'ready' | 'error'

 

export function ApiReference({ openApiUrl }: { openApiUrl: string }) {
  let [state, setState] = useState<LoadState>('loading')
  let [error, setError] = useState<string | null>(null)
  let [isDark, setIsDark] = useState(false)
  let elementRef = useRef<HTMLDivElement | null>(null)
  let [scriptReady, setScriptReady] = useState(false)
  let { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) {
      return
    }
    setIsDark(resolvedTheme === 'dark')
  }, [resolvedTheme])

  useEffect(() => {
    let active = true

    async function load() {
      setState('loading')
      setError(null)
      try {
        let response = await fetch(openApiUrl, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`OpenAPI fetch failed (${response.status})`)
        }
        if (!active) {
          return
        }
        setState('ready')
      } catch (err) {
        if (!active) {
          return
        }
        setError(err instanceof Error ? err.message : 'OpenAPI fetch failed')
        setState('error')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [openApiUrl])

  let scalarCss = useMemo(
    () => `
      :root {
        --scalar-font: Inter, system-ui, sans-serif;
        --scalar-background-1: var(--docs-bg);
        --scalar-background-2: var(--docs-surface);
        --scalar-border-color: var(--docs-border);
        --scalar-color-1: var(--docs-text);
        --scalar-color-2: var(--docs-muted);
        --scalar-color-3: #64748b;
        --scalar-sidebar-background-1: var(--docs-bg);
        --scalar-sidebar-item-hover-background: var(--docs-hover);
        --scalar-sidebar-item-active-background: var(--docs-hover);
        --scalar-sidebar-border-color: var(--docs-border);
        --scalar-sidebar-color-1: var(--docs-text);
        --scalar-sidebar-color-2: var(--docs-muted);
        --scalar-sidebar-color-active: var(--docs-text);
        --scalar-sidebar-search-background: var(--docs-surface);
        --scalar-sidebar-search-border-color: var(--docs-border);
        --scalar-sidebar-search-color: var(--docs-muted);
      }
      .scalar-api-reference,
      .scalar-api-reference .sidebar,
      .scalar-api-reference .sidebar .sidebar-content {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
      }
      .scalar-api-reference .sidebar {
        align-self: stretch;
      }
      .dark-mode {
        --scalar-background-1: var(--docs-bg);
        --scalar-background-2: var(--docs-surface);
        --scalar-border-color: var(--docs-border);
        --scalar-color-1: var(--docs-text);
        --scalar-color-2: var(--docs-muted);
        --scalar-color-3: #94a3b8;
      }
      .dark-mode .sidebar {
        --scalar-sidebar-background-1: var(--docs-bg);
        --scalar-sidebar-item-hover-background: var(--docs-hover);
        --scalar-sidebar-item-active-background: var(--docs-hover);
        --scalar-sidebar-border-color: var(--docs-border);
        --scalar-sidebar-color-1: var(--docs-text);
        --scalar-sidebar-color-2: var(--docs-muted);
        --scalar-sidebar-color-active: var(--docs-text);
        --scalar-sidebar-search-background: var(--docs-surface);
        --scalar-sidebar-search-border-color: var(--docs-border);
        --scalar-sidebar-search-color: var(--docs-muted);
      }
    `,
    [],
  )

  useEffect(() => {
    let element = elementRef.current
    if (!element || state !== 'ready' || !scriptReady) {
      return
    }
    let Scalar = (window as unknown as { Scalar?: { createApiReference: Function } })
      .Scalar
    if (!Scalar?.createApiReference) {
      return
    }
    element.innerHTML = ''
    Scalar.createApiReference(element, {
      url: openApiUrl,
      theme: 'none',
      layout: 'modern',
      darkMode: isDark,
      forceDarkModeState: isDark ? 'dark' : 'light',
      hideDarkModeToggle: true,
      hideModels: true,
      showDeveloperTools: 'never',
      withDefaultFonts: false,
      customCss: scalarCss,
    })
  }, [isDark, openApiUrl, scalarCss, scriptReady, state])

  useEffect(() => {
    let script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest'
    script.async = true
    script.onload = () => {
      window.dispatchEvent(new Event('scalar:ready'))
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    let handleReady = () => setScriptReady(true)
    window.addEventListener('scalar:ready', handleReady)
    if ((window as unknown as { Scalar?: unknown }).Scalar) {
      setScriptReady(true)
    }
    return () => {
      window.removeEventListener('scalar:ready', handleReady)
    }
  }, [])

  useEffect(() => {
    return () => {
      let element = elementRef.current
      if (element) {
        element.innerHTML = ''
      }

      let root = document.documentElement
      let body = document.body
      let scrubScalarClasses = (node: HTMLElement) => {
        for (let className of Array.from(node.classList)) {
          if (className === 'dark-mode' || className.startsWith('scalar-')) {
            node.classList.remove(className)
          }
        }
      }
      scrubScalarClasses(root)
      scrubScalarClasses(body)

      document
        .querySelectorAll(
          'style[data-scalar], style#scalar-theme, style[id^="scalar-"], link[data-scalar], link[id^="scalar-"]',
        )
        .forEach((node) => node.remove())
    }
  }, [])

  return (
    <div className="space-y-8 pt-6 pb-10">
      <Prose>
        <h1>API Reference</h1>
        <p>
          The API Reference is generated from the live OpenAPI schema. The public
          contract is versioned under <strong>/v1</strong> and remains stable for
          integrations.
        </p>
      </Prose>

      <div className="rounded-3xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--docs-text)]">
              OpenAPI schema
            </p>
            <p className="text-xs text-[color:var(--docs-muted)]">{openApiUrl}</p>
          </div>
          <a
            className="text-sm font-semibold text-[color:var(--docs-link)] hover:text-[color:var(--docs-link-hover)]"
            href={openApiUrl}
            rel="noreferrer"
            target="_blank"
          >
            View JSON
          </a>
        </div>
      </div>

      {state === 'loading' && (
        <div className="rounded-3xl border border-dashed border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-6 text-sm text-[color:var(--docs-muted)]">
          Loading OpenAPI schema...
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-3xl border border-dashed border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-6 text-sm text-[color:var(--docs-muted)]">
          Unable to load the OpenAPI schema. {error}
        </div>
      )}

      {state === 'ready' && (
        <div className="overflow-hidden rounded-3xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] px-4 py-6 sm:px-6">
          <div
            id="scalar-reference"
            ref={elementRef}
            style={{ minHeight: '70vh' }}
          />
        </div>
      )}
    </div>
  )
}
