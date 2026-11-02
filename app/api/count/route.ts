import { USAGE_EVENTS, type UsageEvent } from '../../../lib/usage.ts'
import { checkWork, COUNT_BITS } from '../../../lib/work.ts'
import { addCount } from '../../../server/usage.ts'
import { readJson } from '../../../server/validate.ts'

const TOKEN = /^[0-9a-f]{32}$/

// Takes an anonymous +1. Only three event names, each paid for with a small puzzle.
export async function POST(request: Request) {
  const input = (await readJson(request)) as { event?: unknown; token?: unknown; nonce?: unknown } | null
  const event = input?.event as UsageEvent
  const token = input?.token
  if (!USAGE_EVENTS.includes(event) || typeof token !== 'string' || !TOKEN.test(token)) {
    return Response.json({ error: 'Invalid count' }, { status: 400 })
  }
  if (!checkWork('count', `${event}:${token}`, input?.nonce, new Date(), COUNT_BITS)) {
    return Response.json({ error: 'Invalid count' }, { status: 400 })
  }
  await addCount(event, token)
  return new Response(null, { status: 204 })
}
