// Builds the weekly report on the device from the public feed and the local profile.
import { alertMatches, computeRisk, stepKey } from './risk.ts'
import type { RankedAlert } from './risk.ts'
import type { Alert, AppData, Profile, Snapshot } from './types.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const RISK_ORDER = { low: 0, medium: 1, high: 2 }

export interface Change {
  kind: 'new' | 'confirmed' | 'risk_up' | 'risk_down' | 'removed'
  id: string
  title: string
}

export interface Report {
  weekLabel: string
  topRisks: RankedAlert[]
  changes: Change[]
  nextAction: { alert: Alert; action: string } | null
}

// Weeks run Monday to Sunday and are named by their Monday, like 2026-10-26.
function mondayOf(now: Date) {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return new Date(midnight - ((now.getUTCDay() + 6) % 7) * DAY_MS)
}

export const weekKey = (now: Date) => mondayOf(now).toISOString().slice(0, 10)

// UTC keeps a date from slipping to the day before in some time zones.
export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })

function takeSnapshot(alerts: Alert[], profile: Profile, week: string): Snapshot {
  const entries = alerts
    .filter((alert) => alertMatches(alert, profile))
    .map((a) => [a.id, { title: a.title, risk: a.risk, status: a.status }])
  return { week, alerts: Object.fromEntries(entries) }
}

// Once a week, files this week's picture away so next week has something to compare.
export function rollSnapshots(data: AppData, alerts: Alert[], now: Date): AppData {
  const week = weekKey(now)
  if (!data.profile || data.snapshots.current?.week === week) return data
  const current = takeSnapshot(alerts, data.profile, week)
  return { ...data, snapshots: { previous: data.snapshots.current, current } }
}

function findChanges(matching: Alert[], previous: Snapshot | null, now: Date): Change[] {
  // In the first week there is no history, so recent alerts count as new.
  if (!previous) {
    const cutoff = now.getTime() - 7 * DAY_MS
    return matching
      .filter((alert) => Date.parse(alert.date) >= cutoff)
      .map((alert) => ({ kind: 'new', id: alert.id, title: alert.title }))
  }

  const changes: Change[] = []
  for (const { id, title, risk, status } of matching) {
    const before = previous.alerts[id]
    if (!before) changes.push({ kind: 'new', id, title })
    else if (before.status === 'rumor' && status === 'confirmed') {
      changes.push({ kind: 'confirmed', id, title })
    } else if (RISK_ORDER[risk] > RISK_ORDER[before.risk]) {
      changes.push({ kind: 'risk_up', id, title })
    } else if (RISK_ORDER[risk] < RISK_ORDER[before.risk]) {
      changes.push({ kind: 'risk_down', id, title })
    }
  }
  const stillListed = new Set(matching.map((alert) => alert.id))
  for (const [id, { title }] of Object.entries(previous.alerts)) {
    if (!stillListed.has(id)) changes.push({ kind: 'removed', id, title })
  }
  return changes
}

// Picks the first unfinished step on the alert that matters most.
function findNextAction(ranked: RankedAlert[], doneSteps: string[]) {
  for (const { alert } of ranked) {
    const action = alert.actions.find((step) => !doneSteps.includes(stepKey(alert, step)))
    if (action) return { alert, action }
  }
  return null
}

export function buildReport(alerts: Alert[], data: AppData, profile: Profile, now: Date): Report {
  const { ranked } = computeRisk(alerts, profile, data.doneSteps)
  const monday = mondayOf(now)
  return {
    weekLabel: `${formatDate(monday)} to ${formatDate(new Date(monday.getTime() + 6 * DAY_MS))}`,
    topRisks: ranked.slice(0, 3),
    changes: findChanges(ranked.map((item) => item.alert), data.snapshots.previous, now),
    nextAction: findNextAction(ranked, data.doneSteps),
  }
}
