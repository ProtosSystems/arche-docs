# Arche Docs

Documentation site for the Arche API, built with Next.js App Router, MDX, and a live OpenAPI-backed reference.

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation structure

Canonical public docs live at the site root, such as `/quickstart`, `/reference`, and `/guides/restatement-drift`.

Current top-level sections:

- Get started
- Core concepts
- Guides
- API

## OpenAPI reference

The API Reference page at `/reference` renders the OpenAPI schema using Scalar. Configure the
schema URL via `NEXT_PUBLIC_OPENAPI_URL` (defaults to `/openapi.json`).

The same configured schema source is also used to build API Reference search results. If
`NEXT_PUBLIC_OPENAPI_URL` points to a remote schema, search indexes that remote document; otherwise
it falls back to `public/openapi.json`.

Refresh the local docs copy with:

```bash
npm run sync:openapi
```

This sync must use a raw `/openapi.json` payload from `arche_api`. Do not copy
`../arche_api/tests/openapi/snapshots/openapi.json`; that file is normalized for contract tests and
strips summaries, descriptions, operationIds, and examples that the docs site needs.

## Phantom endpoint check

Validate that docs only mention `/v1` routes that exist in the OpenAPI schema:

```bash
npm run check:phantom-endpoints
```

## Customizing

- Foundational docs pages live under `src/app/(docs)/`.
- Guide pages live under `src/app/(docs)/guides/`.
- Shared docs navigation and metadata helpers live in `src/lib/docs.ts`.
- MDX UI primitives such as callouts, next-step cards, and tabbed code blocks live in `src/components/mdx.tsx`.

## Global search

Global search is powered by [FlexSearch](https://github.com/nextapps-de/flexsearch). It indexes the MDX docs pages plus the configured OpenAPI schema.

Search behavior lives in `src/lib/search.ts`.

## License

This site template is a commercial product and is licensed under the [Tailwind Plus license](https://tailwindcss.com/plus/license).
