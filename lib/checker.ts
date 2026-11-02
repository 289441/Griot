// Decides if a pasted message is really from us. Runs on the device.
import { textProblems } from './safety.ts'
import type { Alert } from './types.ts'

export type Verdict = 'scam' | 'real' | 'unknown'

export function checkMessage(text: string, alerts: Alert[]): Verdict {
  if (textProblems(text).length) return 'scam'
  const lower = text.toLowerCase()
  return alerts.some((alert) => lower.includes(alert.title.toLowerCase())) ? 'real' : 'unknown'
}
