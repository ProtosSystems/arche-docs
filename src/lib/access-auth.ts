export const AUTH_COOKIE_NAME = 'site_auth'
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

type Credentials = {
  username: string
  password: string
}

export function getConfiguredCredentials(): Credentials | null {
  const username = process.env.SITE_USERNAME?.trim()
  const password = process.env.SITE_PASSWORD?.trim()

  if (!username || !password) {
    return null
  }

  return { username, password }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function buildAuthToken(
  username: string,
  password: string,
): Promise<string> {
  return sha256Hex(`${username}:${password}`)
}

export async function getExpectedAuthToken(): Promise<string | null> {
  const credentials = getConfiguredCredentials()
  if (!credentials) {
    return null
  }
  return buildAuthToken(credentials.username, credentials.password)
}
