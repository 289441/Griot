import { buildReport } from '../lib/report.ts'
import type { Change } from '../lib/report.ts'
import { stepKey } from '../lib/risk.ts'
import { accentTag, btnPrimary, card, heading, title } from '../lib/styles.ts'
import type { Alert, AppData, Profile } from '../lib/types.ts'
import { toggleStep } from './AlertDetail.tsx'
import Badges from './Badges.tsx'

interface Props {
  alerts: Alert[]
  data: AppData
  profile: Profile
}

const CHANGE_LABEL: Record<Change['kind'], string> = {
  new: 'New',
  confirmed: 'Confirmed',
  risk_up: 'Worse',
  risk_down: 'Better',
  removed: 'Gone',
}

// Built fresh on this device every time it opens. Nothing is sent anywhere.
export default function Report({ alerts, data, profile }: Props) {
  const report = buildReport(alerts, data, profile, new Date())
  const next = report.nextAction

  return (
    <div className="grid gap-5">
      <header>
        <h1 className={title}>This week</h1>
        <p className="text-sm text-muted">{report.weekLabel}</p>
      </header>

      <section className={`${card} grid gap-3 p-5`}>
        <h2 className="label-tag">Do one thing</h2>
        {next ? (
          <>
            <p className={heading}>{next.action}</p>
            <button
              className={`${btnPrimary} w-full`}
              onClick={() => toggleStep(stepKey(next.alert, next.action))}
            >
              Done
            </button>
          </>
        ) : (
          <p className={heading}>All done. Nice work.</p>
        )}
      </section>

      {report.topRisks.length > 0 && (
        <section className="grid gap-2">
          <h2 className={heading}>Top risks</h2>
          {report.topRisks.map(({ alert }) => (
            <a key={alert.id} href={`#/alert/${alert.id}`} className={`${card} grid gap-1.5 p-4 no-underline`}>
              <Badges alert={alert} />
              <span className="font-bold">{alert.title}</span>
            </a>
          ))}
        </section>
      )}

      {report.changes.length > 0 && (
        <section className="grid gap-2">
          <h2 className={heading}>What changed</h2>
          <ul className={`${card} divide-y divide-line px-4`}>
            {report.changes.map((change) => (
              <li key={`${change.kind}-${change.id}`} className="grid gap-1 py-3">
                <span className={`${accentTag} w-fit`}>{CHANGE_LABEL[change.kind]}</span>
                {change.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
