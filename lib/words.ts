// The few words the app uses for each level.
import type { Risk } from './types.ts'

export const LEVEL: Record<Risk, string> = { low: 'Watch', medium: 'Act soon', high: 'Act now' }

export const STATUS_WORD: Record<Risk, string> = { low: 'All clear', medium: 'Heads up', high: 'Act now' }
