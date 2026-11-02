// The app's only memory. Everything here stays in this browser's localStorage.
import { useSyncExternalStore } from 'react'
import { parseFeed } from './feed.ts'
import { CATEGORIES, COUNTRIES, EARNINGS, HOLDINGS, RISKS, STATUSES } from './options.ts'
import type { AppData, Profile, Snapshot } from './types.ts'

const KEY = 'griot:v1'

// The app was called Freedom Tracker, so data saved under the old name moves over once.
export function moveOldKey(oldKey: string, newKey: string) {
  try {
    const old = localStorage.getItem(oldKey)
    if (old !== null && localStorage.getItem(newKey) === null) localStorage.setItem(newKey, old)
    localStorage.removeItem(oldKey)
  } catch {
    // Storage is blocked, so there is nothing to move.
  }
}

export const EMPTY_DATA: AppData = {
  version: 1,
  profile: null,
  readAlerts: [],
  seenAlerts: [],
  plan: { safePlace: '', checks: [] },
  following: [],
  reporterKey: null,
  receipts: [],
  doneSteps: [],
  snapshots: { previous: null, current: null },
  lastFeed: null,
  lastFetchedAt: null,
  notifyPromptSeen: false,
  installHintDismissed: false,
}

const texts = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []

function cleanProfile(value: unknown): Profile | null {
  const p = (value ?? {}) as Record<string, unknown>
  const holdings = texts(p.holdings).filter((h) => h in HOLDINGS) as Profile['holdings']
  if (!((p.country as string) in COUNTRIES) || holdings.length === 0) return null
  return {
    country: p.country as string,
    holdings,
    earning: (p.earning as string) in EARNINGS ? (p.earning as Profile['earning']) : undefined,
    worry: (p.worry as string) in CATEGORIES ? (p.worry as Profile['worry']) : undefined,
  }
}

function cleanSnapshot(value: unknown): Snapshot | null {
  const s = value as Snapshot | null
  if (typeof s?.week !== 'string' || typeof s.alerts !== 'object' || !s.alerts) return null
  const entries = Object.entries(s.alerts).filter(
    ([, a]) => typeof a?.title === 'string' && a.risk in RISKS && a.status in STATUSES,
  )
  return { week: s.week, alerts: Object.fromEntries(entries) }
}

// Rebuilds data field by field, so a damaged or edited file can't break the app.
export function cleanData(raw: unknown): AppData {
  const d = (raw ?? {}) as Partial<AppData>
  let lastFeed = null
  try {
    if (d.lastFeed) lastFeed = parseFeed(d.lastFeed).feed
  } catch {
    // A broken saved feed is simply fetched again.
  }
  return {
    version: 1,
    profile: cleanProfile(d.profile),
    readAlerts: texts(d.readAlerts),
    seenAlerts: texts(d.seenAlerts),
    plan: {
      safePlace: typeof d.plan?.safePlace === 'string' ? d.plan.safePlace.slice(0, 500) : '',
      checks: texts(d.plan?.checks),
    },
    following: texts(d.following),
    reporterKey: typeof d.reporterKey === 'string' ? d.reporterKey : null,
    receipts: texts(d.receipts),
    doneSteps: texts(d.doneSteps),
    snapshots: {
      previous: cleanSnapshot(d.snapshots?.previous),
      current: cleanSnapshot(d.snapshots?.current),
    },
    lastFeed,
    lastFetchedAt: typeof d.lastFetchedAt === 'string' ? d.lastFetchedAt : null,
    notifyPromptSeen: d.notifyPromptSeen === true,
    installHintDismissed: d.installHintDismissed === true,
  }
}

let cache: AppData | null = null
const listeners = new Set<() => void>()

function getData(): AppData {
  if (cache) return cache
  moveOldKey('freedom-tracker:v1', KEY)
  try {
    cache = cleanData(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    cache = EMPTY_DATA
  }
  return cache
}

function setData(next: AppData) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private browsing can block storage. The app still works until it closes.
  }
  listeners.forEach((listen) => listen())
}

export const readData = getData

export const updateData = (change: (data: AppData) => AppData) => setData(change(getData()))

function subscribe(listen: () => void) {
  listeners.add(listen)
  // Keeps other open tabs in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return
    cache = null
    listen()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listen)
    window.removeEventListener('storage', onStorage)
  }
}

export const useData = () => useSyncExternalStore(subscribe, getData, () => EMPTY_DATA)

// The saved feed is public and can be fetched again, so backups leave it out.
export function exportData() {
  return JSON.stringify({ ...getData(), lastFeed: undefined, lastFetchedAt: undefined }, null, 2)
}

export function importData(text: string) {
  const imported = cleanData(JSON.parse(text))
  if (!imported.profile) throw new Error('This file is not a Griot backup.')
  const { lastFeed, lastFetchedAt } = getData()
  setData({ ...imported, lastFeed, lastFetchedAt })
}

export function wipeData() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing was stored, so there is nothing to remove.
  }
  cache = EMPTY_DATA
  listeners.forEach((listen) => listen())
}
