import { ArrowLeft, BadgeCheck, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { markSeen } from '../lib/push.ts'
import { formatDate } from '../lib/report.ts'
import { stepKey } from '../lib/risk.ts'
import { updateData } from '../lib/storage.ts'
import { refreshFeed } from '../lib/sync.ts'
import { btnLink, btnSevere, heading, title } from '../lib/styles.ts'
import type { Alert, AppData, Profile } from '../lib/types.ts'
import Badges from './Badges.tsx'

interface Props {
  id: string
  alerts: Alert[]
  data: AppData
  profile: Profile
}

const RETRIES = 6
const RETRY_MS = 4000

// Adds or removes one finished step. Shared with the weekly report.
export function toggleStep(key: string) {
  updateData((data) => ({
    ...data,
    doneSteps: data.doneSteps.includes(key)
      ? data.doneSteps.filter((step) => step !== key)
      : [...data.doneSteps, key],
  }))
}

// Remembers it here and stops the reminders for this device.
function acknowledge(id: string) {
  updateData((data) => ({ ...data, seenAlerts: [...data.seenAlerts, id] }))
  markSeen(id)
}

const backLink = (
  <a href="#/" className={`${btnLink} w-fit gap-1.5`}>
    <ArrowLeft size={18} aria-hidden />
    Back
  </a>
)

export default function AlertDetail({ id, alerts, data }: Props) {
  const alert = alerts.find((item) => item.id === id)

  useEffect(() => {
    if (!alert) return
    updateData((d) =>
      d.readAlerts.includes(alert.id) ? d : { ...d, readAlerts: [...d.readAlerts, alert.id] },
    )
  }, [alert])

  // A brand new alert can take a few seconds to reach the feed, so keep looking.
  const [tries, setTries] = useState(0)
  useEffect(() => {
    if (alert || tries >= RETRIES) return
    const timer = setTimeout(() => refreshFeed().finally(() => setTries((count) => count + 1)), RETRY_MS)
    return () => clearTimeout(timer)
  }, [alert, tries])

  if (!alert) {
    return (
      <>
        <p className="text-muted">{tries < RETRIES ? 'Getting your alert…' : 'This alert is gone.'}</p>
        {backLink}
      </>
    )
  }

  const urgent = alert.risk === 'high' && !alert.withdrawn && !data.seenAlerts.includes(alert.id)

  return (
    <article className="grid gap-3">
      {backLink}
      {urgent && (
        <div data-theme="night" className="grid gap-3 rounded-card bg-ground p-5 text-ink">
          <p className="animate-pop font-display text-[44px] leading-none font-bold text-danger">
            Act now
          </p>
          {data.plan.safePlace && (
            <p>
              <span className="label-tag block">Your plan</span>
              {data.plan.safePlace}
            </p>
          )}
          <p className="text-sm text-muted">Nobody will ever ask for your recovery words.</p>
          <button className={btnSevere} onClick={() => acknowledge(alert.id)}>
            I&apos;ve seen this
          </button>
        </div>
      )}
      {alert.correction && (
        <p className="rounded-bubble bg-warn-soft px-4 py-3">
          <strong>Correction:</strong> {alert.correction}
        </p>
      )}
      <Badges alert={alert} />
      <h1 className={`${title} ${alert.withdrawn ? 'line-through' : ''}`}>{alert.title}</h1>
      <p className="text-lg leading-7">{alert.summary}</p>

      {!alert.withdrawn && (
        <>
          <h2 className={`${heading} mt-3`}>Do this</h2>
          <ul className="grid gap-2">
            {alert.actions.map((action) => {
              const key = stepKey(alert, action)
              return (
                <li key={action}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-bubble bg-surface p-4 shadow-elev-1 has-checked:bg-sunken has-checked:text-muted has-checked:shadow-none">
                    <input
                      type="checkbox"
                      className="size-6 shrink-0 accent-(--accent)"
                      checked={data.doneSteps.includes(key)}
                      onChange={() => toggleStep(key)}
                    />
                    <span>{action}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <p className="mt-2 text-sm text-muted">{formatDate(alert.date)}</p>
      {alert.reporter && (
        <a href={`#/reporter/${alert.reporter.pubkey}`} className={`${btnLink} w-fit gap-1.5`}>
          {alert.reporter.name}
          {alert.reporter.verified && <BadgeCheck size={18} aria-label="Verified" />}
        </a>
      )}
      <a
        className={`${btnLink} w-fit gap-1.5`}
        href={alert.source_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {alert.sample ? 'Sample source' : 'Source'}
        <ExternalLink size={16} aria-hidden />
      </a>
    </article>
  )
}
