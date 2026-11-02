import { quietTag, riskTag } from '../lib/styles.ts'
import type { Alert } from '../lib/types.ts'
import { LEVEL } from '../lib/words.ts'

// Words sit on every tag, so meaning never depends on colour alone.
export default function Badges({ alert }: { alert: Alert }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {alert.withdrawn ? (
        <span className={quietTag}>Withdrawn</span>
      ) : (
        <span className={riskTag(alert.risk)}>{LEVEL[alert.risk]}</span>
      )}
      {alert.status === 'rumor' && <span className={quietTag}>Not confirmed</span>}
      {alert.correction && <span className={quietTag}>Corrected</span>}
      {alert.sample && <span className={quietTag}>Sample</span>}
    </div>
  )
}
