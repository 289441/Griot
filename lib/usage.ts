// Anonymous usage totals: each phone sends a +1, never who it is.
import { COUNT_BITS, doWork } from './work.ts'

export const USAGE_EVENTS = ['open', 'install', 'setup'] as const
export type UsageEvent = (typeof USAGE_EVENTS)[number]

// What this phone has already counted, kept only on the phone.
export interface Counted {
  day: string | null
  install: boolean
  setup: boolean
}

const KEY = 'griot:counted'
const NONE: Counted = { day: null, install: false, setup: false }

export const dayKey = (now: Date) => now.toISOString().slice(0, 10)

// Opens count once a day, installs and setups once ever.
export function dueEvents(counted: Counted, today: string, installed: boolean): UsageEvent[] {
  const due: UsageEvent[] = []
  if (counted.day !== today) due.push('open')
  if (installed && !counted.install) due.push('install')
  return due
}

export function markCounted(counted: Counted, event: UsageEvent, today: string): Counted {
  if (event === 'open') return { ...counted, day: today }
  return { ...counted, [event]: true }
}

function readCounted(): Counted {
  try {
    return { ...NONE, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return NONE
  }
}

function saveCounted(counted: Counted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(counted))
  } catch {
    // Private windows can block storage. Counting is a nice to have, so skip it.
  }
}

// A fresh random token per count, so a solved puzzle can't be replayed.
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function send(event: UsageEvent, now: Date) {
  const token = newToken()
  const nonce = await doWork('count', `${event}:${token}`, now, COUNT_BITS)
  const response = await fetch('/api/count', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event, token, nonce }),
  }).catch(() => null)
  return response?.ok === true
}

// Marks an event only once the server has it, so offline phones try again later.
async function count(events: UsageEvent[], now: Date) {
  const today = dayKey(now)
  for (const event of events) {
    if (await send(event, now)) saveCounted(markCounted(readCounted(), event, today))
  }
}

export const countVisit = (installed: boolean, now = new Date()) =>
  count(dueEvents(readCounted(), dayKey(now), installed), now)

export const countSetup = (now = new Date()) => (readCounted().setup ? Promise.resolve() : count(['setup'], now))
