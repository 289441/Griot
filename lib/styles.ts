// Class names for buttons, cards and tags, so every screen looks and presses the same way
import type { Risk } from './types.ts'

const press =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-center font-bold transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-elev-2 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0'

export const btn = `${press} bg-surface text-ink shadow-elev-1 ring-1 ring-line`
export const btnPrimary = `${press} bg-accent text-on-accent shadow-elev-1`
export const btnSevere = `${press} bg-danger text-on-accent shadow-elev-1`
export const btnLink = 'inline-flex min-h-11 items-center font-bold text-info underline underline-offset-4'

export const card = 'rounded-card bg-surface shadow-elev-1'
export const title = 'font-display text-[30px] leading-[34px] font-extrabold'
export const heading = 'font-display text-xl leading-6 font-bold'

const tagBase = 'inline-flex shrink-0 items-center rounded-chip px-2 py-0.5 text-xs leading-4 font-bold'

export const quietTag = `${tagBase} bg-sunken text-muted`
export const accentTag = `${tagBase} bg-accent-soft text-accent-ink`

const riskColour: Record<Risk, string> = {
  low: 'bg-info-soft text-risk-low',
  medium: 'bg-warn-soft text-risk-medium',
  high: 'bg-danger text-on-accent',
}

export const riskTag = (risk: Risk) => `${tagBase} ${riskColour[risk]}`

export const row =
  'flex min-h-14 w-full items-center gap-3 rounded-bubble bg-surface px-4 py-3 text-left font-bold text-ink no-underline shadow-elev-1 transition-[transform,box-shadow] duration-150 hover:shadow-elev-2 active:scale-[0.99]'

export const field = 'min-h-12 w-full rounded-bubble bg-sunken px-4 py-3 text-ink ring-1 ring-line'
