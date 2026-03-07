export const DEFAULT_OPENAPI_URL = '/openapi.json'

export function resolveOpenApiUrl(): string {
  return process.env.NEXT_PUBLIC_OPENAPI_URL || DEFAULT_OPENAPI_URL
}
