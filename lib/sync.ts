// Downloads the public feed. Every user gets the same list, so it reveals nothing.
import { rollSnapshots } from './report.ts'
import { readSignedFeed } from './signing.ts'
import { updateData } from './storage.ts'

// Returns false when offline, and the last saved feed stays on screen.
export async function refreshFeed(): Promise<boolean> {
  try {
    const response = await fetch('/api/feed', { cache: 'no-cache' })
    if (!response.ok) return false
    const pubkey = process.env.NEXT_PUBLIC_ALERT_PUBKEY ?? ''
    const { alerts, rejected } = readSignedFeed(await response.json(), pubkey)
    if (rejected) console.warn(`Rejected ${rejected} alerts without a valid seal.`)
    // A totally broken feed must not wipe alerts and show a false "low risk".
    if (!alerts.length && rejected) return false
    const now = new Date()
    const feed = { version: 1, generated_at: now.toISOString(), alerts }
    updateData((data) =>
      rollSnapshots({ ...data, lastFeed: feed, lastFetchedAt: now.toISOString() }, alerts, now),
    )
    return true
  } catch {
    return false
  }
}
