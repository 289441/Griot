// Checks the alerts feed. One gate for the app and for any future news generator.
import { CATEGORIES, EARNINGS, HOLDINGS, RISKS, STATUSES } from './options.ts'
import { isOfficialSource, textProblems } from './safety.ts'
import type { Alert, Feed } from './types.ts'

const isText = (value: unknown) => typeof value === 'string' && value.trim().length > 0

const isListOf = (value: unknown, allowed: object) =>
  Array.isArray(value) && value.length > 0 && value.every((item) => item in allowed)

// Only https links, so a bad feed can't plant a script behind "View source".
function isSafeLink(value: unknown) {
  try {
    return new URL(value as string).protocol === 'https:'
  } catch {
    return false
  }
}

const isDate = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value))

// Lists everything wrong with one alert. An empty list means it is valid.
export function alertProblems(value: unknown): string[] {
  const alert = (value ?? {}) as Record<string, unknown>
  const problems: string[] = []
  if (!isText(alert.id)) problems.push('id is missing')
  if (!isText(alert.title)) problems.push('title is missing')
  if (!isText(alert.summary)) problems.push('summary is missing')
  const countries = alert.countries
  if (
    !Array.isArray(countries) ||
    !countries.length ||
    !countries.every((c) => c === '*' || /^[A-Z]{2}$/.test(c))
  ) {
    problems.push('countries must be two letter codes or "*"')
  }
  if (!isListOf(alert.affects, HOLDINGS)) problems.push('affects has an unknown value')
  if (!((alert.risk as string) in RISKS)) problems.push('risk must be low, medium or high')
  if (!((alert.status as string) in STATUSES)) problems.push('status must be confirmed or rumor')
  if (!Array.isArray(alert.actions) || !alert.actions.length || !alert.actions.every(isText)) {
    problems.push('actions must be a list of steps')
  }
  if (!isSafeLink(alert.source_url)) problems.push('source_url must be an https link')
  else if (!isOfficialSource(alert.source_url as string)) problems.push('source_url is not an official site')
  if (alert.status === 'rumor' && alert.risk === 'high') problems.push('a rumor can never be high risk')
  const actions = Array.isArray(alert.actions) ? alert.actions : []
  for (const text of [alert.title, alert.summary, alert.correction, ...actions]) {
    if (typeof text === 'string') problems.push(...textProblems(text))
  }
  if (!isDate(alert.date)) problems.push('date must be YYYY-MM-DD')
  if (alert.category !== undefined && !((alert.category as string) in CATEGORIES)) {
    problems.push('category has an unknown value')
  }
  if (alert.earners !== undefined && !isListOf(alert.earners, EARNINGS)) {
    problems.push('earners has an unknown value')
  }
  return problems
}

// Keeps the valid alerts and reports the rest, so one bad alert can't break the app.
export function parseFeed(raw: unknown): { feed: Feed; problems: string[] } {
  const input = (raw ?? {}) as { version?: unknown; generated_at?: unknown; alerts?: unknown }
  if (!Array.isArray(input.alerts)) throw new Error('Feed has no alerts list')

  const alerts: Alert[] = []
  const problems: string[] = []
  const seen = new Set<string>()

  input.alerts.forEach((item, index) => {
    const found = alertProblems(item)
    const id = String((item as Alert | null)?.id ?? index)
    if (seen.has(id)) found.push('id is used twice')
    if (found.length) {
      problems.push(`alert ${id}: ${found.join(', ')}`)
      return
    }
    seen.add(id)
    alerts.push(item as Alert)
  })

  const generated_at = typeof input.generated_at === 'string' ? input.generated_at : ''
  const version = typeof input.version === 'number' ? input.version : 1
  return { feed: { version, generated_at, alerts }, problems }
}
