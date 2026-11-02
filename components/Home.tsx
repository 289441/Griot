import {
  BellOff,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
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
import { accentTag, btnLink, card, row } from '../lib/styles.ts'
import type { Alert, AppData, Profile, Risk } from '../lib/types.ts'
import { STATUS_WORD, updatedAgo } from '../lib/words.ts'
import Badges from './Badges.tsx'

const STATUS: Record<Risk, { Icon: LucideIcon; tint: string }> = {
  low: { Icon: ShieldCheck, tint: 'bg-accent-soft text-accent-ink' },
  medium: { Icon: ShieldAlert, tint: 'bg-warn-soft text-warn' },
  high: { Icon: Siren, tint: 'bg-danger-soft text-danger' },
}

const SHOWN = 3

interface Props {
  alerts: Alert[]
  data: AppData
  profile: Profile
  refreshing: boolean
  onRefresh: () => void
}

export default function Home({ alerts, data, profile, refreshing, onRefresh }: Props) {
  const { level, ranked } = computeRisk(alerts, profile, data.doneSteps)
  const [alarmsOn, setAlarmsOn] = useState<boolean | null>(null)
  const [showAll, setShowAll] = useState(false)
  const installed = isInstalled()

  useEffect(() => {
    getPushState().then((state) => setAlarmsOn(state === 'on'))
  }, [])

  const { Icon, tint } = STATUS[level]
  const urgent = ranked.find(
    ({ alert }) => alert.risk === 'high' && !data.seenAlerts.includes(alert.id),
  )?.alert
  const ready = readiness(data.plan, alarmsOn === true, installed)

  // Alerts with every step done move out of the way, into a closed Done list.
  const isFinished = (alert: Alert) => stepsDone(alert, data.doneSteps) === alert.actions.length
  const open = ranked.filter(({ alert }) => !isFinished(alert))
  const finished = ranked.filter(({ alert }) => isFinished(alert))
  const visible = showAll ? open : open.slice(0, SHOWN)

  const alertCard = (alert: Alert) => (
    <a
      key={alert.id}
      href={`#/alert/${alert.id}`}
      className={`${card} grid gap-1.5 p-4 no-underline active:scale-[0.99]`}
    >
      <span className="flex items-start justify-between gap-2">
        <Badges alert={alert} />
        {!data.readAlerts.includes(alert.id) && <span className={accentTag}>New</span>}
      </span>
      <span className="font-bold">{alert.title}</span>
    </a>
  )

  return (
    <div className="grid gap-4">
      {urgent ? (
        <a
          href={`#/alert/${urgent.id}`}
          data-theme="night"
          className="grid animate-pop justify-items-center gap-2 rounded-card bg-ground px-5 py-7 text-center text-ink no-underline"
        >
          <Siren className="text-danger" size={56} aria-hidden />
          <h1 className="font-display text-4xl leading-none font-bold text-danger">Act now</h1>
          <span className="font-bold">{urgent.title}</span>
        </a>
      ) : (
        <section className={`${card} grid justify-items-center gap-2 px-5 py-7 text-center`}>
          <span className={`grid size-28 animate-pop place-items-center rounded-full ${tint}`}>
            <Icon size={56} aria-hidden />
          </span>
          <h1 className="font-display text-4xl leading-none font-bold">{STATUS_WORD[level]}</h1>
          <p className="text-muted">
            {open.length ? `${open.length} for you` : 'Nothing for you right now'}
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

      <p className="flex items-center justify-between gap-2 text-sm text-muted">
        <span>{refreshing ? 'Updating…' : updatedAgo(data.lastFetchedAt, new Date())}</span>
        <button className={`${btnLink} gap-1.5 text-sm`} onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} aria-hidden className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </p>

      {visible.length > 0 && <section className="grid gap-2.5">{visible.map(({ alert }) => alertCard(alert))}</section>}

      {open.length > SHOWN && (
        <button className={`${btnLink} justify-center`} onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
          {showAll ? 'Show less' : `See ${open.length - SHOWN} more`}
        </button>
      )}

      {finished.length > 0 && (
        <details className="group">
          <summary className={`${row} cursor-pointer list-none text-muted [&::-webkit-details-marker]:hidden`}>
            <span className="flex-1">Done ({finished.length})</span>
            <ChevronDown className="transition-transform group-open:rotate-180" size={20} aria-hidden />
          </summary>
          <div className="mt-2.5 grid gap-2.5">{finished.map(({ alert }) => alertCard(alert))}</div>
        </details>
      )}

      {!data.lastFeed && <p className="text-center text-muted">Can&apos;t load alerts. Try again soon.</p>}

      <a href="#/report" className={row}>
        <span className="flex-1">This week</span>
        <ChevronRight className="text-muted" size={20} aria-hidden />
      </a>
    </div>
  )
}
