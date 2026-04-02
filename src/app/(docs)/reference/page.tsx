import { ApiReference } from '@/components/ApiReference'
import { resolveOpenApiUrl } from '@/lib/openapi'
import { createDocMetadata } from '@/lib/docs'

export const metadata = createDocMetadata({
  title: 'API reference',
  description: 'Explore the live Arche OpenAPI contract and related task-first entry points.',
  path: '/reference',
})

export default function ReferencePage() {
  let openApiUrl = resolveOpenApiUrl()

  return (
    <>
      <div className="mx-auto max-w-3xl pt-10 pb-6 lg:ml-4 lg:mr-auto">
        <h1 className="text-3xl font-semibold text-[color:var(--docs-text)]">
          API reference
        </h1>
        <p className="mt-4 text-base text-[color:var(--docs-muted)]">
          The reference is generated from the current OpenAPI schema. Use it for exact route,
          parameter, and response details, then pair it with the task-first guides for workflow
          context.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <a
            href="/quickstart"
            className="rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-4 transition hover:border-[color:var(--docs-link)] hover:bg-[color:var(--docs-hover)]"
          >
            <p className="text-sm font-semibold text-[color:var(--docs-text)]">Quickstart</p>
            <p className="mt-1 text-sm text-[color:var(--docs-muted)]">
              Start with a full request flow before drilling into route details.
            </p>
          </a>
          <a
            href="/request-response-conventions"
            className="rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-4 transition hover:border-[color:var(--docs-link)] hover:bg-[color:var(--docs-hover)]"
          >
            <p className="text-sm font-semibold text-[color:var(--docs-text)]">
              Request &amp; response conventions
            </p>
            <p className="mt-1 text-sm text-[color:var(--docs-muted)]">
              Understand envelopes, timestamps, and pagination semantics.
            </p>
          </a>
          <a
            href="/guides/company-resolution-and-statement-retrieval"
            className="rounded-2xl border border-[color:var(--docs-border)] bg-[color:var(--docs-surface)] p-4 transition hover:border-[color:var(--docs-link)] hover:bg-[color:var(--docs-hover)]"
          >
            <p className="text-sm font-semibold text-[color:var(--docs-text)]">Workflow guide</p>
            <p className="mt-1 text-sm text-[color:var(--docs-muted)]">
              See how the issuer, filings, and statements routes fit together.
            </p>
          </a>
        </div>
      </div>
      <ApiReference openApiUrl={openApiUrl} />
    </>
  )
}
