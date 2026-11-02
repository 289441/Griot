// The on-device brain: decides which alerts apply and how worried to be.
import type { Alert, Profile, Risk } from './types.ts'

// Points per alert. One confirmed high alert alone is enough to reach High.
const BASE_POINTS: Record<Risk, number> = { low: 1, medium: 3, high: 6 }
const RUMOR_FACTOR = 0.5
const WORRY_FACTOR = 1.25
const FULLY_DONE_FACTOR = 0.25

export const MEDIUM_FROM = 3
export const HIGH_FROM = 6

export interface RankedAlert {
  alert: Alert
  points: number
}

export interface RiskResult {
  level: Risk
  score: number
  ranked: RankedAlert[]
}

// A step's identity includes its words, so a rewritten step starts undone.
export const stepKey = (alert: Alert, action: string) => `${alert.id}|${action}`

export const stepsDone = (alert: Alert, doneSteps: string[]) =>
  alert.actions.filter((action) => doneSteps.includes(stepKey(alert, action))).length

// An alert applies if it covers the country and touches their money or income.
export function alertMatches(alert: Alert, profile: Profile) {
  const inCountry = alert.countries.includes('*') || alert.countries.includes(profile.country)
  const touchesMoney = alert.affects.some((holding) => profile.holdings.includes(holding))
  const touchesIncome = profile.earning ? alert.earners?.includes(profile.earning) : false
  return !alert.withdrawn && inCountry && (touchesMoney || Boolean(touchesIncome))
}

// Rumors count half, their biggest worry counts more, and finished steps count less.
export function alertPoints(alert: Alert, profile: Profile, doneSteps: string[]) {
  const doneShare = stepsDone(alert, doneSteps) / alert.actions.length
  let points = BASE_POINTS[alert.risk]
  if (alert.status === 'rumor') points *= RUMOR_FACTOR
  if (alert.category === profile.worry) points *= WORRY_FACTOR
  return points * (1 - doneShare * (1 - FULLY_DONE_FACTOR))
}

export function computeRisk(alerts: Alert[], profile: Profile, doneSteps: string[]): RiskResult {
  const ranked = alerts
    .filter((alert) => alertMatches(alert, profile))
    .map((alert) => ({ alert, points: alertPoints(alert, profile, doneSteps) }))
    .sort((a, b) => b.points - a.points || b.alert.date.localeCompare(a.alert.date))

  const score = ranked.reduce((total, item) => total + item.points, 0)
  const level = score >= HIGH_FROM ? 'high' : score >= MEDIUM_FROM ? 'medium' : 'low'
  return { level, score, ranked }
}
