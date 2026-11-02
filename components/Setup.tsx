import {
  BellRing,
  Bitcoin,
  Banknote,
  Check,
  Coins,
  Landmark,
  Repeat,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { COUNTRIES } from '../lib/options.ts'
import { enablePush, syncTopics } from '../lib/push.ts'
import { go } from '../lib/router.ts'
import { updateData } from '../lib/storage.ts'
import { btn, btnPrimary, title } from '../lib/styles.ts'
import type { Holding } from '../lib/types.ts'

const screen =
  'mx-auto flex min-h-dvh w-full max-w-md animate-rise flex-col gap-5 px-5 pt-[calc(36px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]'

const MONEY: { id: Holding; label: string; Icon: LucideIcon }[] = [
  { id: 'bank', label: 'Bank', Icon: Landmark },
  { id: 'fintech', label: 'Money app', Icon: Smartphone },
  { id: 'exchange', label: 'Exchange', Icon: Repeat },
  { id: 'bitcoin', label: 'My Bitcoin wallet', Icon: Bitcoin },
  { id: 'cash', label: 'Cash', Icon: Banknote },
  { id: 'foreign_currency', label: 'Dollars or stablecoins', Icon: Coins },
]

export function PlaceStep({ country, onPick }: { country: string; onPick: (country: string) => void }) {
  return (
    <div className={screen}>
      <h1 className={title}>Where do you live?</h1>
      <CountrySelect value={country} onChange={onPick} />
    </div>
  )
}

export function CountrySelect({ value, onChange }: { value: string; onChange: (country: string) => void }) {
  return (
      <select
        aria-label="Country"
        name="country"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-14 w-full rounded-pill bg-surface px-5 text-lg font-bold text-ink shadow-elev-1"
      >
        <option value="" disabled>
          Pick your country
        </option>
        {Object.entries(COUNTRIES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
  )
}

// Saves the answers, updates alarm topics, and goes home.
export function saveProfile(country: string, holdings: Holding[]) {
  updateData((data) => ({ ...data, profile: { ...data.profile, country, holdings } }))
  syncTopics()
  go('')
}

export function MoneyStep({ country, onBack }: { country: string; onBack: () => void }) {
  const [holdings, setHoldings] = useState<Holding[]>([])

  return (
    <div className={screen}>
      <h1 className={title}>Where is your money?</h1>
      <MoneyTiles holdings={holdings} onChange={setHoldings} />
      <div className="mt-auto flex gap-2.5">
        <button className={`${btn} flex-1`} onClick={onBack}>
          Back
        </button>
        <button
          className={`${btnPrimary} flex-[2]`}
          disabled={!holdings.length}
          onClick={() => saveProfile(country, holdings)}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function MoneyTiles({
  holdings,
  onChange,
}: {
  holdings: Holding[]
  onChange: (holdings: Holding[]) => void
}) {
  const toggle = (id: Holding) =>
    onChange(holdings.includes(id) ? holdings.filter((item) => item !== id) : [...holdings, id])

  return (
      <div className="grid grid-cols-2 gap-3">
        {MONEY.map(({ id, label, Icon }) => (
          <label
            key={id}
            className="relative grid min-h-28 cursor-pointer place-items-center gap-1 rounded-card bg-surface p-3 text-center font-bold shadow-elev-1 transition-transform active:scale-[0.97] has-checked:bg-accent has-checked:text-on-accent"
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={holdings.includes(id)}
              onChange={() => toggle(id)}
            />
            <Icon size={28} aria-hidden />
            <span className="leading-5">{label}</span>
          </label>
        ))}
      </div>
  )
}

const finishAlarm = () => updateData((data) => ({ ...data, notifyPromptSeen: true }))

export function AlarmStep() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function turnOn() {
    setBusy(true)
    setError('')
    try {
      await enablePush()
      finishAlarm()
    } catch (problem) {
      setError((problem as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className={screen}>
      <div className="grid flex-1 place-content-center justify-items-center gap-4 text-center">
        <span className="grid size-28 animate-pop place-items-center rounded-full bg-accent-soft text-accent-ink">
          <BellRing size={52} aria-hidden />
        </span>
        <h1 className={title}>Turn on your alarm</h1>
        <p className="flex items-center gap-2 text-muted">
          <Check size={18} className="text-accent-ink" aria-hidden />
          Only for real danger.
        </p>
        <p className="text-sm leading-5 text-muted">
          We only get your country and money types. Never your name.
        </p>
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
      </div>
      <button className={`${btnPrimary} w-full text-lg`} disabled={busy} onClick={turnOn}>
        {busy ? 'Turning on…' : 'Turn on'}
      </button>
      <button className={`${btn} w-full`} onClick={finishAlarm}>
        Not now
      </button>
    </div>
  )
}
