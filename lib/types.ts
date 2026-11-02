import type { CATEGORIES, EARNINGS, HOLDINGS, RISKS, STATUSES } from './options.ts'

export type Holding = keyof typeof HOLDINGS
export type Earning = keyof typeof EARNINGS
export type Category = keyof typeof CATEGORIES
export type Risk = keyof typeof RISKS
export type Status = keyof typeof STATUSES

// One alert in the public feed. The feed is identical for every user.
export interface Alert {
  id: string
  title: string
  summary: string
  countries: string[] // two letter codes, or "*" for everywhere
  affects: Holding[]
  risk: Risk
  actions: string[]
  source_url: string
  date: string // YYYY-MM-DD
  status: Status
  category?: Category // lets us rank what the user fears most
  earners?: Earning[] // also matches people by how they earn
  sample?: boolean // made up example, always labelled in the app
  correction?: string // what we got wrong, shown on the alert forever
  withdrawn?: boolean // proved false, kept visible but no longer counted
  reporter?: AlertReporter // who reported it, if not anonymous
}

export interface AlertReporter {
  name: string
  pubkey: string
  verified: boolean
}

export interface Feed {
  version: number
  generated_at: string
  alerts: Alert[]
}

export interface Profile {
  country: string
  holdings: Holding[]
  earning?: Earning
  worry?: Category
}

// The user's own emergency plan. It never leaves this device.
export interface Plan {
  safePlace: string
  checks: string[]
}

// What the user's alerts looked like at one moment, used for "what changed".
export interface Snapshot {
  week: string
  alerts: Record<string, { title: string; risk: Risk; status: Status }>
}

// Everything the app remembers. It lives only in this browser.
export interface AppData {
  version: 1
  profile: Profile | null
  readAlerts: string[]
  seenAlerts: string[]
  plan: Plan
  following: string[]
  reporterKey: string | null // this device's reporter identity, only if they made one
  receipts: string[]
  doneSteps: string[]
  snapshots: { previous: Snapshot | null; current: Snapshot | null }
  lastFeed: Feed | null
  lastFetchedAt: string | null
  notifyPromptSeen: boolean
  installHintDismissed: boolean
}
