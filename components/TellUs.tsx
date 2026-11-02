import { Copy, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { backupKey, newReporterKey } from '../lib/reporter.ts'
import { claimName, reportStatus, sendReport } from '../lib/reporting.ts'
import { updateData } from '../lib/storage.ts'
import { btn, btnPrimary, card, field, heading, quietTag, title } from '../lib/styles.ts'
import type { AppData } from '../lib/types.ts'

const STATUS_WORD: Record<string, string> = {
  pending: 'Waiting for review',
  published: 'Published. Thank you!',
  rejected: 'Not published',
}

export default function TellUs({ data }: { data: AppData }) {
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [useName, setUseName] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState('')

  async function send() {
    setBusy(true)
    setError('')
    try {
      const links = link.trim() ? [link.trim()] : []
      const code = await sendReport(body.trim(), links, useName ? data.reporterKey : null)
      updateData((d) => ({ ...d, receipts: [code, ...d.receipts].slice(0, 20) }))
      setReceipt(code)
      setBody('')
      setLink('')
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (receipt) {
    return (
      <div className="grid gap-4">
        <h1 className={title}>Sent. Thank you!</h1>
        <div className={`${card} grid gap-2 p-5`}>
          <span className="label-tag">Your receipt</span>
          <code className="text-lg font-bold break-all select-all">{receipt}</code>
          <p className="text-sm text-muted">Use it to check your report.</p>
        </div>
        <button className={btnPrimary} onClick={() => setReceipt('')}>
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <h1 className={title}>Saw something?</h1>
      <p className="flex items-center gap-2 text-sm text-muted">
        <ShieldCheck size={18} className="shrink-0 text-accent-ink" aria-hidden />
        In danger? Use Tor Browser.
      </p>

      <textarea
        aria-label="What did you see?"
        name="report"
        autoComplete="off"
        rows={5}
        maxLength={2000}
        value={body}
        placeholder="What did you see…"
        onChange={(event) => setBody(event.target.value)}
        className={field}
      />
      <input
        aria-label="Proof link"
        name="proof"
        autoComplete="off"
        type="url"
        value={link}
        placeholder="Proof link, like https://…"
        onChange={(event) => setLink(event.target.value)}
        className={field}
      />

      {data.reporterKey && (
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Send as">
          <button className={useName ? btn : btnPrimary} onClick={() => setUseName(false)}>
            Anonymous
          </button>
          <button className={useName ? btnPrimary : btn} onClick={() => setUseName(true)}>
            My name
          </button>
        </div>
      )}

      {error && <p className="text-sm font-bold text-danger">{error}</p>}
      <button className={btnPrimary} disabled={busy || body.trim().length < 10} onClick={send}>
        {busy ? 'Sending…' : 'Send'}
      </button>

      {data.receipts.length > 0 && <Receipts receipts={data.receipts} />}
      <ClaimName hasKey={data.reporterKey !== null} />
    </div>
  )
}

function Receipts({ receipts }: { receipts: string[] }) {
  const [states, setStates] = useState<Record<string, string>>({})

  async function check(code: string) {
    const result = await reportStatus(code)
    const word = result ? (STATUS_WORD[result.status] ?? result.status) : 'Not found'
    setStates((all) => ({ ...all, [code]: result?.reason ? `${word}: ${result.reason}` : word }))
  }

  return (
    <section className="grid gap-2">
      <h2 className={heading}>My reports</h2>
      {receipts.map((code) => (
        <button key={code} className={`${card} grid gap-1 p-4 text-left`} onClick={() => check(code)}>
          <code className="text-sm break-all">{code}</code>
          <span className="text-sm text-muted">{states[code] ?? 'Tap to check'}</span>
        </button>
      ))}
    </section>
  )
}

function ClaimName({ hasKey }: { hasKey: boolean }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [proof, setProof] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  async function claim() {
    setError('')
    try {
      const key = newReporterKey()
      await claimName(name.trim(), key, proof.trim())
      updateData((d) => ({ ...d, reporterKey: key }))
      setSaved(backupKey(key))
    } catch (problem) {
      setError((problem as Error).message)
    }
  }

  if (saved) {
    return (
      <section className={`${card} grid gap-2 p-5`}>
        <h2 className={heading}>Save your key</h2>
        <p className="text-sm text-muted">Lose it and you lose this name. Never share it.</p>
        <code className="text-sm break-all select-all">{saved}</code>
        <button className={btn} onClick={() => navigator.clipboard?.writeText(saved)}>
          <Copy size={18} aria-hidden />
          Copy
        </button>
      </section>
    )
  }

  if (hasKey) return null

  if (!open) {
    return (
      <button className={btn} onClick={() => setOpen(true)}>
        Get a reporter name
      </button>
    )
  }

  return (
    <section className={`${card} grid gap-3 p-5`}>
      <h2 className={heading}>Your reporter name</h2>
      <input
        aria-label="Reporter name"
        name="reporter-name"
        autoComplete="off"
        spellCheck={false}
        value={name}
        maxLength={30}
        placeholder="A real name or pen name…"
        onChange={(event) => setName(event.target.value)}
        className={field}
      />
      <input
        aria-label="Link to verify you"
        name="reporter-proof"
        autoComplete="off"
        type="url"
        value={proof}
        placeholder="Your site or profile (optional)…"
        onChange={(event) => setProof(event.target.value)}
        className={field}
      />
      <span className={`${quietTag} w-fit`}>Add a link to get verified</span>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
      <button className={btnPrimary} disabled={name.trim().length < 2} onClick={claim}>
        Save
      </button>
    </section>
  )
}
