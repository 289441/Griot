// The few words the app uses for each level.
import type { Risk } from './types.ts'

export const LEVEL: Record<Risk, string> = { low: 'Watch', medium: 'Act soon', high: 'Act now' }

export const STATUS_WORD: Record<Risk, string> = { low: 'All clear', medium: 'Heads up', high: 'Act now' }

const MINUTE_MS = 60 * 1000

// How long ago the feed was fetched, in short words.
export function updatedAgo(fetchedAt: string | null, now: Date) {
  if (!fetchedAt) return 'Not updated yet'
  const minutes = Math.floor((now.getTime() - Date.parse(fetchedAt)) / MINUTE_MS)
  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Updated ${hours} h ago`
  const days = Math.floor(hours / 24)
  return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`
}
