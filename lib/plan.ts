// The readiness score. Pure, so it is easy to test.
import type { Plan } from './types.ts'

export const PLAN_STEPS = [
  { id: 'backup', label: 'I know where my backup is' },
  { id: 'recovery', label: 'I tested my recovery' },
  { id: 'second', label: 'I have a safe second wallet' },
]

export function readiness(plan: Plan, alarmsOn: boolean, installed: boolean) {
  const manual = PLAN_STEPS.filter((step) => plan.checks.includes(step.id)).length
  return { done: manual + Number(alarmsOn) + Number(installed), total: PLAN_STEPS.length + 2 }
}
