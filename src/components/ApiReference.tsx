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

  function hideAskAiUi(root: ParentNode) {
    const candidates = root.querySelectorAll(
      'a, button, [role="button"], [class*="ask-ai"], [data-testid*="ask-ai"]',
    )

    for (const node of Array.from(candidates)) {
      const text = node.textContent?.trim().toLowerCase() ?? ''
      if (text === 'ask ai' || text.includes('ask ai')) {
        ;(node as HTMLElement).style.display = 'none'
        ;(node as HTMLElement).setAttribute('aria-hidden', 'true')
      }
    }
  }

  function neutralizeScalarTopOverlays(root: ParentNode) {
    const candidates = root.querySelectorAll<HTMLElement>(
      '[class*="scalar"], [id*="scalar"], [data-scalar], [class*="api-reference"]',
    )

    for (const node of Array.from(candidates)) {
      const style = window.getComputedStyle(node)
      const top = Number.parseFloat(style.top || '9999')
      const isTopLayer =
        (style.position === 'fixed' || style.position === 'sticky') && top <= 64

      if (isTopLayer) {
        node.style.pointerEvents = 'none'
        node.style.zIndex = '1'
      }
    }
  }

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
      .scalar-api-reference,
      .scalar-api-reference * {
        z-index: auto !important;
      }
      .scalar-api-reference .sidebar {
        align-self: stretch;
      }
      /* Keep one authoritative search UX (header search) */
      .scalar-api-reference .sidebar-search,
      .scalar-api-reference [data-testid='sidebar-search'],
      .scalar-api-reference .sidebar [role='search'],
      .scalar-api-reference .sidebar input[type='search'],
      .scalar-api-reference .sidebar input[placeholder*='Search'] {
        display: none !important;
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
      layout: 'classic',
      darkMode: isDark,
      forceDarkModeState: isDark ? 'dark' : 'light',
      hideDarkModeToggle: true,
      hideModels: true,
      hideSearch: true,
      showDeveloperTools: 'never',
      agent: {
        disabled: true,
      },
      withDefaultFonts: false,
      customCss: scalarCss,
    })
    hideAskAiUi(element)
    neutralizeScalarTopOverlays(element)
  }, [isDark, openApiUrl, scalarCss, scriptReady, state])

  useEffect(() => {
    let element = elementRef.current
    if (!element) {
      return
    }

    const observer = new MutationObserver(() => {
      hideAskAiUi(element)
      neutralizeScalarTopOverlays(element)
    })

    observer.observe(element, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [state, scriptReady])

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
