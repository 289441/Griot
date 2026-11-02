import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { useState } from 'react'
import { checkMessage, type Verdict } from '../lib/checker.ts'
import { connectAgent, disconnectAgent } from '../lib/reporting.ts'
import { moveOldKey } from '../lib/storage.ts'
import { btn, btnLink, btnPrimary, card, field, title } from '../lib/styles.ts'
import type { Alert, Profile } from '../lib/types.ts'

const backToMore = (
  <a href="#/more" className={`${btnLink} w-fit gap-1.5`}>
    <ArrowLeft size={18} aria-hidden />
    Back
  </a>
)

const VERDICT: Record<Verdict, { word: string; hint: string; tint: string; Icon: typeof ShieldCheck }> = {
  scam: { word: 'Scam', hint: 'Do not reply or tap anything.', tint: 'bg-danger-soft text-danger', Icon: ShieldAlert },
  real: { word: 'Real alert', hint: 'This matches our signed list.', tint: 'bg-accent-soft text-accent-ink', Icon: ShieldCheck },
  unknown: { word: 'Not from us', hint: 'We have no alert like this.', tint: 'bg-warn-soft text-warn', Icon: ShieldQuestion },
}

export function CheckPage({ alerts }: { alerts: Alert[] }) {
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const result = verdict && VERDICT[verdict]

  return (
    <div className="grid gap-4">
      {backToMore}
      <h1 className={title}>Is this real?</h1>
      <textarea
        aria-label="Paste the message"
        name="message"
        autoComplete="off"
        rows={5}
        value={text}
        placeholder="Paste the message here…"
        onChange={(event) => {
          setText(event.target.value)
          setVerdict(null)
        }}
        className={field}
      />
      <button
        className={btnPrimary}
        disabled={!text.trim()}
        onClick={() => setVerdict(checkMessage(text, alerts))}
      >
        Check
      </button>
      {result && (
        <div className={`grid animate-pop justify-items-center gap-1 rounded-card p-6 text-center ${result.tint}`}>
          <result.Icon size={44} aria-hidden />
          <p className="font-display text-3xl font-extrabold">{result.word}</p>
          <p className="text-ink">{result.hint}</p>
        </div>
      )}
    </div>
  )
}

const AGENT_KEY = 'griot:agent-token'

function savedToken() {
  moveOldKey('freedom-tracker:agent-token', AGENT_KEY)
  try {
    return localStorage.getItem(AGENT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function AgentPage({ profile }: { profile: Profile }) {
  const [url, setUrl] = useState('')
  const [token, setToken] = useState(savedToken)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setBusy(true)
    setError('')
    try {
      const created = await connectAgent(url.trim() || null, profile.country, profile.holdings)
      localStorage.setItem(AGENT_KEY, created)
      setToken(created)
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    await disconnectAgent(token)
    localStorage.removeItem(AGENT_KEY)
    setToken('')
  }

  return (
    <div className="grid gap-4">
      {backToMore}
      <h1 className={title}>Connect an agent</h1>
      <p className="text-muted">It hears from us only when an alert concerns you.</p>

      {token ? (
        <>
          <div className={`${card} grid gap-2 p-5`}>
            <span className="label-tag">Agent token</span>
            <code className="text-sm break-all select-all">{token}</code>
          </div>
          <button className={btn} onClick={disconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <>
          <input
            aria-label="Agent web address"
            name="agent-url"
            autoComplete="off"
            type="url"
            value={url}
            placeholder="https:// address (optional)…"
            onChange={(event) => setUrl(event.target.value)}
            className={field}
          />
          {error && <p className="text-sm font-bold text-danger">{error}</p>}
          <button className={btnPrimary} disabled={busy} onClick={connect}>
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </>
      )}
      <p className="text-sm leading-5 text-muted">
        We only ever say &quot;tell your owner&quot;. Never give an agent your recovery words.
      </p>
    </div>
  )
}

const LEGAL = {
  privacy: {
    heading: 'Privacy',
    points: [
      'No accounts, no email, no tracking.',
      'Your plan, progress and follows stay on your device.',
      'With alarms on, we store an anonymous device address, your country and money types.',
      'Reports keep the date, never the time or your IP address in our database.',
      'Our host, and Google or Apple who deliver alarms, can see basic connection details.',
      'Delete all my data removes everything we hold for this device.',
      'A backup file is not encrypted, and holds your reporter key. Keep it private.',
    ],
  },
  terms: {
    heading: 'Terms',
    points: [
      'Free and open source.',
      'General information only, not financial or legal advice.',
      'Alerts can be wrong or late. Always check the source.',
      'We never ask for recovery words or tell you where to send money.',
      'Only report what is true. False reports get rejected.',
    ],
  },
}

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const page = LEGAL[kind]
  return (
    <div className="mx-auto grid w-full max-w-xl gap-4 p-5">
      <a href="#/" className={`${btnLink} w-fit gap-1.5`}>
        <ArrowLeft size={18} aria-hidden />
        Back
      </a>
      <h1 className={title}>{page.heading}</h1>
      <ul className="grid gap-2">
        {page.points.map((point) => (
          <li key={point} className={`${card} p-4`}>
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}
