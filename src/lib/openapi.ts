import { getSiteUrl } from '@/lib/site-url'

export const DEFAULT_OPENAPI_URL = '/openapi.json'

export function resolveOpenApiUrl(): string {
  return process.env.NEXT_PUBLIC_OPENAPI_URL || DEFAULT_OPENAPI_URL
}

export function resolveServerOpenApiUrl(): string {
  const openApiUrl = resolveOpenApiUrl()

  try {
    return new URL(openApiUrl).toString()
  } catch {
    return new URL(openApiUrl, getSiteUrl()).toString()
  }
}
