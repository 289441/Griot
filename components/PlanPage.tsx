import { BellRing, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isInstalled } from '../lib/install.ts'
import { PLAN_STEPS, readiness } from '../lib/plan.ts'
import { getPushState } from '../lib/push.ts'
import { updateData } from '../lib/storage.ts'
import { btn, card, field, row, title } from '../lib/styles.ts'
import type { AppData } from '../lib/types.ts'

const RADIUS = 52
const CIRCLE = 2 * Math.PI * RADIUS

function toggle(id: string) {
  updateData((data) => ({
    ...data,
    plan: {
      ...data.plan,
      checks: data.plan.checks.includes(id)
        ? data.plan.checks.filter((check) => check !== id)
        : [...data.plan.checks, id],
    },
  }))
}

// Proves the alarm works, like a fire drill. Nothing leaves the device.
async function testAlarm() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (!registration) return 'Reload the app, then try again.'
    // Renotify makes a repeat tap ring again instead of silently replacing the last one.
    await registration.showNotification('Test alarm', {
      body: 'Your alarm works.',
      icon: '/icons/icon-192.png',
      tag: 'test-alarm',
      renotify: true,
    } as NotificationOptions)
    const shown = await registration.getNotifications({ tag: 'test-alarm' })
    if (!shown.length) return 'Your phone blocked it. Check its alarm settings.'
    return 'Sent. Nothing showed? Your phone or computer is hiding alarms. Check its settings.'
  } catch {
    return 'Alarms are blocked. Allow them for this site.'
  }
}

export default function PlanPage({ data }: { data: AppData }) {
  const [alarmsOn, setAlarmsOn] = useState(false)
  const [testResult, setTestResult] = useState('')
  const installed = isInstalled()
  const { done, total } = readiness(data.plan, alarmsOn, installed)

  useEffect(() => {
    getPushState().then((state) => setAlarmsOn(state === 'on'))
  }, [])

  const autoSteps = [
    { label: 'Alarm is on', ok: alarmsOn, href: '#/more' },
    { label: 'App is installed', ok: installed, href: '#/install' },
  ]

  return (
    <div className="grid gap-4">
      <h1 className={title}>My plan</h1>

      <section className={`${card} grid justify-items-center gap-1 p-6`}>
        <div className="relative grid size-32 place-items-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="12" className="stroke-sunken" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCLE}
              strokeDashoffset={CIRCLE * (1 - done / total)}
              className="stroke-accent transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <span className="num font-display text-3xl">
            {done}/{total}
          </span>
        </div>
        <p className="font-bold">{done === total ? 'Fully ready' : 'Keep going'}</p>
      </section>

      <ul className="grid gap-2">
        {PLAN_STEPS.map((step) => (
          <li key={step.id}>
            <label className={`${row} cursor-pointer has-checked:bg-sunken has-checked:text-muted has-checked:shadow-none`}>
              <input
                type="checkbox"
                className="size-6 shrink-0 accent-(--accent)"
                checked={data.plan.checks.includes(step.id)}
                onChange={() => toggle(step.id)}
              />
              {step.label}
            </label>
          </li>
        ))}
        {autoSteps.map((step) => (
          <li key={step.label}>
            <a href={step.ok ? undefined : step.href} className={`${row} ${step.ok ? 'bg-sunken text-muted shadow-none' : ''}`}>
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full ${step.ok ? 'bg-accent text-on-accent' : 'bg-sunken'}`}
              >
                {step.ok && <Check size={16} aria-hidden />}
              </span>
              {step.label}
            </a>
          </li>
        ))}
      </ul>

      <label className="grid gap-1.5">
        <span className="font-bold">If danger comes, I will</span>
        <textarea
          name="plan"
          autoComplete="off"
          rows={3}
          maxLength={500}
          value={data.plan.safePlace}
          placeholder="Open my backup wallet…"
          onChange={(event) =>
            updateData((d) => ({ ...d, plan: { ...d.plan, safePlace: event.target.value } }))
          }
          className={field}
        />
        <small className="text-sm text-muted">Stays on this phone. Never write recovery words here.</small>
      </label>

      {alarmsOn && (
        <button className={btn} onClick={async () => setTestResult(await testAlarm())}>
          <BellRing size={18} aria-hidden />
          Test my alarm
        </button>
      )}
      {testResult && (
        <p role="status" className="rounded-bubble bg-sunken px-4 py-3 text-center text-sm">
          {testResult}
        </p>
      )}
    </div>
  )
}
