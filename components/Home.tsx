import {
  BellOff,
  ChevronRight,
  Download,
  ShieldAlert,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { isInstalled } from '../lib/install.ts'
import { readiness } from '../lib/plan.ts'
import { getPushState } from '../lib/push.ts'
import { computeRisk, stepsDone } from '../lib/risk.ts'
import { accentTag, card, row } from '../lib/styles.ts'
import type { Alert, AppData, Profile, Risk } from '../lib/types.ts'
import { STATUS_WORD } from '../lib/words.ts'
import Badges from './Badges.tsx'

const STATUS: Record<Risk, { Icon: LucideIcon; tint: string }> = {
  low: { Icon: ShieldCheck, tint: 'bg-accent-soft text-accent-ink' },
  medium: { Icon: ShieldAlert, tint: 'bg-warn-soft text-warn' },
  high: { Icon: Siren, tint: 'bg-danger-soft text-danger' },
}

interface Props {
  alerts: Alert[]
  data: AppData
  profile: Profile
}

export default function Home({ alerts, data, profile }: Props) {
  const { level, ranked } = computeRisk(alerts, profile, data.doneSteps)
  const [alarmsOn, setAlarmsOn] = useState<boolean | null>(null)
  const installed = isInstalled()

  useEffect(() => {
    getPushState().then((state) => setAlarmsOn(state === 'on'))
  }, [])

  const { Icon, tint } = STATUS[level]
  const urgent = ranked.find(
    ({ alert }) => alert.risk === 'high' && !data.seenAlerts.includes(alert.id),
  )?.alert
  const ready = readiness(data.plan, alarmsOn === true, installed)

  return (
    <div className="grid gap-4">
      {urgent ? (
        <a
          href={`#/alert/${urgent.id}`}
          data-theme="night"
          className="grid animate-pop justify-items-center gap-2 rounded-card bg-ground px-5 py-7 text-center text-ink no-underline"
        >
          <Siren className="text-danger" size={56} aria-hidden />
          <h1 className="font-display text-[44px] leading-none font-extrabold text-danger">Act now</h1>
          <span className="font-bold">{urgent.title}</span>
        </a>
      ) : (
        <section className={`${card} grid justify-items-center gap-2 px-5 py-7 text-center`}>
          <span className={`grid size-28 animate-pop place-items-center rounded-full ${tint}`}>
            <Icon size={56} aria-hidden />
          </span>
          <h1 className="font-display text-[44px] leading-none font-extrabold">{STATUS_WORD[level]}</h1>
          <p className="text-muted">
            {ranked.length ? `${ranked.length} for you` : 'Nothing for you right now'}
          </p>
        </section>
      )}

      {!installed && (
        <a href="#/install" className={row}>
          <Download className="text-accent-ink" size={22} aria-hidden />
          <span className="flex-1">Add to Home Screen</span>
          <ChevronRight className="text-muted" size={20} aria-hidden />
        </a>
      )}

      {alarmsOn === false && (
        <a href="#/more" className={row}>
          <BellOff className="text-danger" size={22} aria-hidden />
          <span className="flex-1">Alarm is off</span>
          <ChevronRight className="text-muted" size={20} aria-hidden />
        </a>
      )}

      <a href="#/plan" className={row}>
        <span className="flex-1">
          <span className="flex justify-between">
            Ready
            <span className="num">
              {ready.done}/{ready.total}
            </span>
          </span>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-pill bg-sunken">
            <span
              className="block h-full origin-left rounded-pill bg-accent transition-transform duration-500"
              style={{ transform: `scaleX(${ready.done / ready.total})` }}
            />
          </span>
        </span>
      </a>

      {ranked.length > 0 && (
        <section className="grid gap-2.5">
          {ranked.map(({ alert }) => {
            const finished = stepsDone(alert, data.doneSteps) === alert.actions.length
            return (
              <a
                key={alert.id}
                href={`#/alert/${alert.id}`}
                className={`${card} grid gap-1.5 p-4 no-underline active:scale-[0.99] ${
                  finished ? 'opacity-60' : ''
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <Badges alert={alert} />
                  {!data.readAlerts.includes(alert.id) && <span className={accentTag}>New</span>}
                </span>
                <span className="font-bold">{alert.title}</span>
              </a>
            )
          })}
        </section>
      )}

      {!data.lastFeed && <p className="text-center text-muted">Can&apos;t load alerts. Try again soon.</p>}

      <a href="#/report" className={row}>
        <span className="flex-1">This week</span>
        <ChevronRight className="text-muted" size={20} aria-hidden />
      </a>
    </div>
  )
}
