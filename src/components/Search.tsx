'use client'

import {
  createAutocomplete,
  type AutocompleteApi,
  type AutocompleteCollection,
  type AutocompleteState,
} from '@algolia/autocomplete-core'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import clsx from 'clsx'
import { usePathname, useRouter } from 'next/navigation'
import {
  Fragment,
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import Highlighter from 'react-highlight-words'

import { type SearchResult as Result } from '@/lib/search-types'
import { navigation } from '@/components/Navigation'
import { useMobileNavigationStore } from './MobileNavigation'

type EmptyObject = Record<string, never>

type Autocomplete = AutocompleteApi<
  Result,
  React.SyntheticEvent,
  React.MouseEvent,
  React.KeyboardEvent
>

function useAutocomplete({ onNavigate }: { onNavigate: () => void }) {
  let id = useId()
  let router = useRouter()
  let [autocompleteState, setAutocompleteState] = useState<
    AutocompleteState<Result> | EmptyObject
  >({})

  function navigate({ itemUrl }: { itemUrl?: string }) {
    if (itemUrl) {
      router.push(itemUrl)
    }

    resetSearchState()
    onNavigate()
  }

  let [autocomplete] = useState<Autocomplete>(() =>
    createAutocomplete<
      Result,
      React.SyntheticEvent,
      React.MouseEvent,
      React.KeyboardEvent
    >({
      id,
      placeholder: 'Find something...',
      defaultActiveItemId: 0,
      onStateChange({ state }) {
        setAutocompleteState(state)
      },
      shouldPanelOpen({ state }) {
        return state.query !== ''
      },
      navigator: {
        navigate,
      },
      async getSources({ query }) {
        return [
          {
            sourceId: 'documentation',
            async getItems() {
              if (query.trim().length < 2) {
                return []
              }

              try {
                const params = new URLSearchParams({ q: query, limit: '8' })
                const response = await fetch(`/api/search?${params.toString()}`, {
                  method: 'GET',
                })

                if (!response.ok) {
                  return []
                }

                const data = (await response.json()) as { results?: Result[] }
                return data.results ?? []
              } catch {
                return []
              }
            },
            getItemUrl({ item }) {
              return item.url
            },
            onSelect: navigate,
          },
        ]
      },
    }),
  )

  const resetSearchState = useCallback(() => {
    autocomplete.setIsOpen(false)
    autocomplete.setActiveItemId(null)
    autocomplete.setCollections([])
    autocomplete.setQuery('')
  }, [autocomplete])

  return { autocomplete, autocompleteState, resetSearchState }
}

function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  )
}

function NoResultsIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.237 4.237 0 0 0 1.24-3c0-.62-.132-1.207-.37-1.738M12.01 12A4.237 4.237 0 0 1 9 13.25c-.635 0-1.237-.14-1.777-.388M12.01 12l3.24 3.25m-3.715-9.661a4.25 4.25 0 0 0-5.975 5.908M4.5 15.5l11-11"
      />
    </svg>
  )
}

function LoadingIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  let id = useId()

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="5.5" strokeLinejoin="round" />
      <path
        stroke={`url(#${id})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 10a5.5 5.5 0 1 0-5.5 5.5"
      />
      <defs>
        <linearGradient
          id={id}
          x1="13"
          x2="9.5"
          y1="9"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function HighlightQuery({ text, query }: { text: string; query: string }) {
  return (
    <Highlighter
      highlightClassName="underline bg-transparent text-[color:var(--docs-link)]"
      searchWords={[query]}
      autoEscape={true}
      textToHighlight={text}
    />
  )
}

function SearchResult({
  result,
  resultIndex,
  autocomplete,
  collection,
  query,
}: {
  result: Result
  resultIndex: number
  autocomplete: Autocomplete
  collection: AutocompleteCollection<Result>
  query: string
}) {
  let id = useId()

  let sectionTitle = navigation.find((section) =>
    section.links.find((link) => link.href === result.url.split('#')[0]),
  )?.title
  let hierarchy = [sectionTitle, result.pageTitle].filter(
    (x): x is string => typeof x === 'string',
  )

  return (
    <li
      className={clsx(
        'group block cursor-default px-4 py-3 aria-selected:bg-[color:var(--docs-hover)]',
        resultIndex > 0 && 'border-t border-[color:var(--docs-border)]',
      )}
      aria-labelledby={`${id}-hierarchy ${id}-title`}
      {...autocomplete.getItemProps({
        item: result,
        source: collection.source,
      })}
    >
      <div
        id={`${id}-title`}
        aria-hidden="true"
        className="text-sm font-medium text-[color:var(--docs-text)] group-aria-selected:text-[color:var(--docs-link)]"
      >
        <HighlightQuery text={result.title} query={query} />
      </div>
      {hierarchy.length > 0 && (
        <div
          id={`${id}-hierarchy`}
          aria-hidden="true"
          className="mt-1 truncate text-2xs whitespace-nowrap text-[color:var(--docs-muted)]"
        >
          {hierarchy.map((item, itemIndex, items) => (
            <Fragment key={itemIndex}>
              <HighlightQuery text={item} query={query} />
              <span
                className={
                  itemIndex === items.length - 1
                    ? 'sr-only'
                    : 'mx-2 text-[color:var(--docs-border)]'
                }
              >
                /
              </span>
            </Fragment>
          ))}
        </div>
      )}
    </li>
  )
}

function SearchResults({
  autocomplete,
  query,
  collection,
}: {
  autocomplete: Autocomplete
  query: string
  collection: AutocompleteCollection<Result>
}) {
  if (collection.items.length === 0) {
    return (
      <div className="p-6 text-center">
        <NoResultsIcon className="mx-auto h-5 w-5 stroke-[color:var(--docs-text)]" />
        <p className="mt-2 text-xs text-[color:var(--docs-muted)]">
          Nothing found for{' '}
          <strong className="font-semibold wrap-break-word text-[color:var(--docs-text)]">
            &lsquo;{query}&rsquo;
          </strong>
          . Please try again.
        </p>
      </div>
    )
  }

  return (
    <ul {...autocomplete.getListProps()}>
      {collection.items.map((result, resultIndex) => (
        <SearchResult
          key={result.url}
          result={result}
          resultIndex={resultIndex}
          autocomplete={autocomplete}
          collection={collection}
          query={query}
        />
      ))}
    </ul>
  )
}

const SearchInput = forwardRef<
  React.ElementRef<'input'>,
  {
    autocomplete: Autocomplete
    autocompleteState: AutocompleteState<Result> | EmptyObject
    onClose: () => void
  }
>(function SearchInput({ autocomplete, autocompleteState, onClose }, inputRef) {
  let inputProps = autocomplete.getInputProps({ inputElement: null })

  return (
    <div className="group relative flex h-12">
      <SearchIcon className="pointer-events-none absolute top-0 left-3 h-full w-5 stroke-[color:var(--docs-muted)]" />
      <input
        ref={inputRef}
        data-autofocus
        className={clsx(
          'flex-auto appearance-none bg-transparent pl-10 text-[color:var(--docs-text)] outline-none placeholder:text-[color:var(--docs-muted)] focus:w-full focus:flex-none focus-visible:ring-1 focus-visible:ring-[color:var(--docs-border)] focus-visible:ring-inset sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
          autocompleteState.status === 'stalled' ? 'pr-11' : 'pr-4',
        )}
        {...inputProps}
        onKeyDown={(event) => {
          if (
            event.key === 'Escape' &&
            !autocompleteState.isOpen &&
            autocompleteState.query === ''
          ) {
            // In Safari, closing the dialog with the escape key can sometimes cause the scroll position to jump to the
            // bottom of the page. This is a workaround for that until we can figure out a proper fix in Headless UI.
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur()
            }

            onClose()
          } else {
            inputProps.onKeyDown(event)
          }
        }}
      />
      {autocompleteState.status === 'stalled' && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <LoadingIcon className="h-5 w-5 animate-spin stroke-[color:var(--docs-border)] text-[color:var(--docs-text)]" />
        </div>
      )}
    </div>
  )
})

function SearchDialog({
  open,
  setOpen,
  className,
  onNavigate = () => {},
}: {
  open: boolean
  setOpen: (open: boolean) => void
  className?: string
  onNavigate?: () => void
}) {
  let formRef = useRef<React.ElementRef<'form'>>(null)
  let panelRef = useRef<React.ElementRef<'div'>>(null)
  let inputRef = useRef<React.ElementRef<typeof SearchInput>>(null)
  let { autocomplete, autocompleteState, resetSearchState } = useAutocomplete({
    onNavigate() {
      onNavigate()
      setOpen(false)
    },
  })
  let pathname = usePathname()

  useEffect(() => {
    resetSearchState()
    setOpen(false)
  }, [pathname, resetSearchState, setOpen])

  useEffect(() => {
    if (open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false)
        resetSearchState()
      }}
      className={clsx('fixed inset-0 z-50', className)}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/20 backdrop-blur-xs data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-20 md:py-32 lg:px-8 lg:py-[15vh]">
        <DialogPanel
          transition
          className="mx-auto transform-gpu overflow-hidden rounded-lg bg-[color:var(--docs-surface)] shadow-xl ring-1 ring-[color:var(--docs-border)] data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:max-w-xl"
        >
          <div {...autocomplete.getRootProps({})}>
            <form
              ref={formRef}
              {...autocomplete.getFormProps({
                inputElement: inputRef.current,
              })}
            >
              <SearchInput
                ref={inputRef}
                autocomplete={autocomplete}
                autocompleteState={autocompleteState}
                onClose={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                className="border-t border-[color:var(--docs-border)] bg-[color:var(--docs-bg)] empty:hidden"
                {...autocomplete.getPanelProps({})}
              >
                {autocompleteState.isOpen &&
                  autocompleteState.collections?.[0] && (
                  <SearchResults
                    autocomplete={autocomplete}
                    query={autocompleteState.query}
                    collection={autocompleteState.collections[0]}
                  />
                )}
              </div>
            </form>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function useSearchProps() {
  let buttonRef = useRef<React.ElementRef<'button'>>(null)
  let [open, setOpen] = useState(false)

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true)
      },
    },
    dialogProps: {
      open,
      setOpen: useCallback((open: boolean) => setOpen(open), [setOpen]),
    },
  }
}

export function Search() {
  let router = useRouter()
  let pathname = usePathname()
  let containerRef = useRef<React.ElementRef<'div'>>(null)
  let inputId = useId()
  let resultsId = useId()
  let [query, setQuery] = useState('')
  let [results, setResults] = useState<Result[]>([])
  let [open, setOpen] = useState(false)
  let [loading, setLoading] = useState(false)

  useEffect(() => {
    setOpen(false)
    setQuery('')
    setResults([])
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    let q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }

    let active = true
    setLoading(true)
    let timeout = window.setTimeout(async () => {
      try {
        let params = new URLSearchParams({ q, limit: '8' })
        let response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) {
          if (active) setResults([])
          return
        }
        let data = (await response.json()) as { results?: Result[] }
        if (active) setResults(data.results ?? [])
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setLoading(false)
      }
    }, 120)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [query])

  return (
    <div
      ref={containerRef}
      className="relative hidden lg:block lg:w-[22rem] lg:shrink-0"
    >
      <label htmlFor={inputId} className="sr-only">
        Search docs
      </label>
      <div className="flex h-8 w-full items-center gap-2 rounded-full bg-[color:var(--docs-surface)] pr-3 pl-2 text-sm text-[color:var(--docs-muted)] ring-1 ring-[color:var(--docs-border)] focus-within:ring-[color:var(--docs-border)]">
        <SearchIcon className="h-5 w-5 stroke-current" />
        <input
          id={inputId}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
            }
            if (event.key === 'Enter' && results[0]?.url) {
              router.push(results[0].url)
              setOpen(false)
              setQuery('')
            }
          }}
          placeholder="Find something..."
          aria-label="Search docs"
          aria-expanded={open}
          aria-controls={resultsId}
          aria-autocomplete="list"
          className="w-full bg-transparent text-[color:var(--docs-text)] outline-none placeholder:text-[color:var(--docs-muted)]"
        />
      </div>
      {open && (loading || results.length > 0 || query.trim().length >= 2) && (
        <div
          id={resultsId}
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-lg border border-[color:var(--docs-border)] bg-[color:var(--docs-bg)] shadow-xl"
        >
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="px-4 py-3 text-xs text-[color:var(--docs-muted)]"
            >
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="px-4 py-3 text-xs text-[color:var(--docs-muted)]"
            >
              No results
            </div>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li key={result.url}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(result.url)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={clsx(
                      'w-full px-4 py-3 text-left',
                      index > 0 && 'border-t border-[color:var(--docs-border)]',
                      'hover:bg-[color:var(--docs-hover)]',
                    )}
                  >
                    <div className="text-sm font-medium text-[color:var(--docs-text)]">
                      {result.title}
                    </div>
                    {result.pageTitle && (
                      <div className="mt-1 text-2xs text-[color:var(--docs-muted)]">
                        {result.pageTitle}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function MobileSearch() {
  let { close } = useMobileNavigationStore()
  let { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="contents lg:hidden">
      <button
        type="button"
        className="relative flex size-6 items-center justify-center rounded-md transition hover:bg-[color:var(--docs-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--docs-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--docs-bg)] lg:hidden"
        aria-label="Find something..."
        {...buttonProps}
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <SearchIcon className="h-5 w-5 stroke-[color:var(--docs-text)]" />
      </button>
      <Suspense fallback={null}>
        <SearchDialog
          className="lg:hidden"
          onNavigate={close}
          {...dialogProps}
        />
      </Suspense>
    </div>
  )
}
