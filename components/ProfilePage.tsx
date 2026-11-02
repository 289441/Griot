import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { btnLink, btnPrimary, title } from '../lib/styles.ts'
import type { Profile } from '../lib/types.ts'
import { CountrySelect, MoneyTiles, saveProfile } from './Setup.tsx'

// Edits the answers in place. Nothing changes until Save.
export default function ProfilePage({ profile }: { profile: Profile }) {
  const [country, setCountry] = useState(profile.country)
  const [holdings, setHoldings] = useState(profile.holdings)

  return (
    <div className="grid gap-4">
      <a href="#/more" className={`${btnLink} w-fit gap-1.5`}>
        <ArrowLeft size={18} aria-hidden />
        Back
      </a>
      <h1 className={title}>My country and money</h1>
      <CountrySelect value={country} onChange={setCountry} />
      <MoneyTiles holdings={holdings} onChange={setHoldings} />
      <button
        className={btnPrimary}
        disabled={!holdings.length}
        onClick={() => saveProfile(country, holdings)}
      >
        Save
      </button>
    </div>
  )
}
