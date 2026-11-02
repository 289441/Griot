import { ArrowLeft, BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { updateData } from '../lib/storage.ts'
import { btn, btnLink, btnPrimary, card, title } from '../lib/styles.ts'
import type { AppData } from '../lib/types.ts'

interface Reporter {
  pubkey: string
  name: string
  verified: boolean
  approved: number
  corrected: number
}

// Follows stay on this device, so nobody learns who you trust.
function toggleFollow(pubkey: string) {
  updateData((data) => ({
    ...data,
    following: data.following.includes(pubkey)
      ? data.following.filter((key) => key !== pubkey)
      : [...data.following, pubkey],
  }))
}

export default function ReporterPage({ pubkey, data }: { pubkey: string; data: AppData }) {
  const [reporter, setReporter] = useState<Reporter | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/reporters')
      .then((response) => response.json())
      .then(({ reporters }) =>
        setReporter((reporters as Reporter[]).find((item) => item.pubkey === pubkey) ?? null),
      )
      .catch(() => setReporter(null))
  }, [pubkey])

  const following = data.following.includes(pubkey)
  const back = (
    <a href="#/" className={`${btnLink} w-fit gap-1.5`}>
      <ArrowLeft size={18} aria-hidden />
      Back
    </a>
  )

  if (reporter === undefined) return back
  if (!reporter) {
    return (
      <>
        {back}
        <p className="text-muted">Reporter not found.</p>
      </>
    )
  }

  return (
    <div className="grid gap-4">
      {back}
      <h1 className={`${title} flex items-center gap-2`}>
        {reporter.name}
        {reporter.verified && <BadgeCheck className="text-info" size={26} aria-label="Verified" />}
      </h1>
      <div className="grid grid-cols-2 gap-2">
        <div className={`${card} p-4 text-center`}>
          <p className="num font-display text-3xl">{reporter.approved}</p>
          <p className="text-sm text-muted">Published</p>
        </div>
        <div className={`${card} p-4 text-center`}>
          <p className="num font-display text-3xl">{reporter.corrected}</p>
          <p className="text-sm text-muted">Corrected</p>
        </div>
      </div>
      <button className={following ? btn : btnPrimary} onClick={() => toggleFollow(pubkey)}>
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}
