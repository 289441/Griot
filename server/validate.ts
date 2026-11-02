// Checks incoming requests so only real, minimal subscriptions are ever stored.
import { COUNTRIES, HOLDINGS } from '../lib/options.ts'
import { checkWork, SUBSCRIBE_BITS } from '../lib/work.ts'
import type { Subscription } from './store.ts'

const MAX_BODY_CHARS = 4096

// Only real browser push services, so nobody can point us at other machines.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
]

export function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1024) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && PUSH_HOSTS.some((host) => host.test(url.hostname))
  } catch {
    return false
  }
}

const isKey = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 256

// Copies only the fields delivery needs and drops anything else sent.
export function cleanSubscription(body: unknown): Subscription | null {
  const { endpoint, keys, country, holdings, nonce } = (body ?? {}) as {
    nonce?: unknown
    endpoint?: unknown
    keys?: Record<string, unknown>
    country?: unknown
    holdings?: unknown
  }
  if (!isPushEndpoint(endpoint) || !isKey(keys?.p256dh) || !isKey(keys?.auth)) return null
  if (!checkWork('subscribe', endpoint, nonce, new Date(), SUBSCRIBE_BITS)) return null
  if (typeof country !== 'string' || !(country in COUNTRIES)) return null
  if (!Array.isArray(holdings) || !holdings.every((holding) => holding in HOLDINGS)) return null
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, country, holdings }
}

// Returns null for anything too big or not valid JSON.
export async function readJson(request: Request): Promise<unknown> {
  if (!request.body) return null
  const decoder = new TextDecoder()
  let text = ''
  // Stops reading as soon as it is too big, so a huge upload can't fill the memory.
  for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
    text += decoder.decode(chunk, { stream: true })
    if (text.length > MAX_BODY_CHARS) return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
