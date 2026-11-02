// The official seal. Alerts are signed Nostr style events, ready for relays in milestone 2.
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure'
import { alertProblems } from './feed.ts'
import type { Alert } from './types.ts'

// Nostr's kind for application data, replaced by a newer event with the same id.
const ALERT_KIND = 30078
const APP_TAG = 'griot-alert'
const NOTICE_TAG = 'griot-notice'
const NOTICE_MAX_AGE_SECONDS = 24 * 60 * 60

export interface AlertEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

// The tiny signed message that fits inside a push.
export interface Notice {
  id: string
  title: string
  risk: Alert['risk']
  correction?: boolean
}

export function signNotice(
  alert: Alert,
  secretKey: Uint8Array,
  now = new Date(),
  correction = false,
): AlertEvent {
  const notice: Notice = {
    id: alert.id,
    title: alert.title.slice(0, 120),
    risk: alert.risk,
    ...(correction ? { correction } : {}),
  }
  return finalizeEvent(
    {
      kind: ALERT_KIND,
      created_at: Math.floor(now.getTime() / 1000),
      tags: [
        ['d', `notice-${alert.id}`],
        ['t', NOTICE_TAG],
      ],
      content: JSON.stringify(notice),
    },
    secretKey,
  )
}

export function signAlert(alert: Alert, secretKey: Uint8Array, now = new Date()): AlertEvent {
  const problems = alertProblems(alert)
  if (problems.length) throw new Error(`Refusing to sign: ${problems.join(', ')}`)
  return finalizeEvent(
    {
      kind: ALERT_KIND,
      created_at: Math.floor(now.getTime() / 1000),
      tags: [
        ['d', alert.id],
        ['t', APP_TAG],
      ],
      content: JSON.stringify(alert),
    },
    secretKey,
  )
}

// Returns the alert only if our key sealed it and nothing has changed since.
export function readAlertEvent(raw: unknown, pubkey: string): Alert | null {
  const event = raw as AlertEvent
  if (event?.kind !== ALERT_KIND || event.pubkey !== pubkey) return null
  try {
    // A fresh copy of plain fields, so the library's "already checked" mark can't skip the check.
    const { id, created_at, kind, tags, content, sig } = event
    if (!verifyEvent({ id, pubkey, created_at, kind, tags, content, sig })) return null
    if (event.tags.some(([name, value]) => name === 't' && value === NOTICE_TAG)) return null
    const alert = JSON.parse(event.content) as Alert
    const sameId = event.tags.some(([name, value]) => name === 'd' && value === alert.id)
    return sameId && alertProblems(alert).length === 0 ? alert : null
  } catch {
    return null
  }
}

// Old notices are refused, so nobody can replay a past scare.
export function readNoticeEvent(raw: unknown, pubkey: string, now: Date): Notice | null {
  const event = raw as AlertEvent
  if (event?.kind !== ALERT_KIND || event.pubkey !== pubkey) return null
  if (now.getTime() / 1000 - event.created_at > NOTICE_MAX_AGE_SECONDS) return null
  try {
    const { id, created_at, kind, tags, content, sig } = event
    if (!verifyEvent({ id, pubkey, created_at, kind, tags, content, sig })) return null
    if (!tags.some(([name, value]) => name === 't' && value === NOTICE_TAG)) return null
    return JSON.parse(content) as Notice
  } catch {
    return null
  }
}

// Keeps only properly sealed alerts, so a hacked server can't add or edit any.
export function readSignedFeed(raw: unknown, pubkey: string) {
  const { events } = (raw ?? {}) as { events?: unknown }
  if (!Array.isArray(events)) throw new Error('Feed has no events list')
  const alerts = events.flatMap((event) => readAlertEvent(event, pubkey) ?? [])
  return { alerts, rejected: events.length - alerts.length }
}
