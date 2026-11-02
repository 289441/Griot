import { useEffect, useState } from 'react'
import { HACKS, HEADLINE } from '../lib/hacks.ts'
import { btnPrimary } from '../lib/styles.ts'
import Logo from './Logo.tsx'

const COUNT_MS = 1400
const REPO_URL = 'https://github.com/289441/Griot'

// Counts up to the real number, because watching it climb is the point.
function useCountUp(target: number) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const frame = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(frame)
    }
    const start = performance.now()
    let frame = 0
    const step = (time: number) => {
      const progress = Math.min((time - start) / COUNT_MS, 1)
      setValue(target * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return value
}

export default function Welcome({ onStart }: { onStart: () => void }) {
  const amount = useCountUp(HEADLINE.amount)

  return (
    <div
      data-theme="night"
      className="flex min-h-dvh flex-col bg-ground px-5 pt-[calc(28px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))] text-ink"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <p className="flex items-center gap-2 font-display text-xl font-bold">
          <Logo />
          <span translate="no">Griot</span>
        </p>

        <div className="flex flex-1 flex-col justify-center py-8">
          <p className="font-display text-[clamp(84px,27vw,132px)] leading-[0.9] font-extrabold text-danger">
            <span className="sr-only">$6.48 billion</span>
            <span aria-hidden className="num">
              ${amount.toFixed(2)}B
            </span>
          </p>
          <p className="mt-3 text-xl leading-7 font-bold">{HEADLINE.label}.</p>

          <ul className="mt-6 grid grid-cols-2 gap-2">
            {HACKS.map((hack, index) => (
              <li key={hack.name} className="animate-rise" style={{ animationDelay: `${(index + 2) * 200}ms` }}>
                <a
                  href={hack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline justify-between gap-2 rounded-bubble bg-surface px-3.5 py-2.5 no-underline"
                >
                  <span className="text-sm text-muted">{hack.name}</span>
                  <span className="num">{hack.amount}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mb-4 font-display text-3xl leading-8 font-extrabold text-balance">
          Get warned before it reaches you.
        </p>
        <button className={`${btnPrimary} w-full text-lg`} onClick={onStart}>
          Protect my money
        </button>
        <p className="mt-3 text-center text-sm text-muted">
          Free. No sign up.{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Open source.
          </a>{' '}
          ·{' '}
          <a href={HEADLINE.url} target="_blank" rel="noopener noreferrer" className="underline">
            Source: {HEADLINE.source}
          </a>
        </p>
      </div>
    </div>
  )
}
