import { EllipsisVertical, Share, SquarePlus, Rocket, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { canPromptInstall, isIOS, isInstalled, promptInstall } from '../lib/install.ts'
import { btn, btnPrimary, card, title } from '../lib/styles.ts'

const IOS_STEPS: [LucideIcon, string][] = [
  [Share, 'Tap Share in Safari'],
  [SquarePlus, 'Tap Add to Home Screen'],
  [Rocket, 'Open it from your Home Screen'],
]

const OTHER_STEPS: [LucideIcon, string][] = [
  [EllipsisVertical, 'Open your browser menu'],
  [SquarePlus, 'Tap Install app'],
  [Rocket, 'Open it from your Home Screen'],
]

export default function InstallPage({
  embedded = false,
  onDone,
}: {
  embedded?: boolean
  onDone?: () => void
}) {
  const [, refresh] = useState(0)
  const steps = isIOS() ? IOS_STEPS : OTHER_STEPS

  return (
    <div
      className={
        embedded
          ? 'grid gap-4'
          : 'mx-auto flex min-h-dvh w-full max-w-md animate-rise flex-col gap-5 px-5 pt-[calc(36px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]'
      }
    >
      <h1 className={title}>{isInstalled() ? 'Installed' : 'Add it to your phone'}</h1>
      {!isInstalled() && (
        <>
          <p className="text-muted">Alarms work best from your Home Screen.</p>
          {canPromptInstall() && !isIOS() ? (
            <button
              className={`${btnPrimary} w-full text-lg`}
              onClick={async () => {
                await promptInstall()
                refresh((count) => count + 1)
              }}
            >
              Install
            </button>
          ) : (
            <ol className="grid gap-3">
              {steps.map(([Icon, label], index) => (
                <li key={label} className={`${card} flex items-center gap-3 p-4 font-bold`}>
                  <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                    {index + 1}
                  </span>
                  <span className="flex-1">{label}</span>
                  <Icon size={22} className="text-muted" aria-hidden />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      {onDone && (
        <button className={`${btn} mt-auto w-full`} onClick={onDone}>
          Later
        </button>
      )}
    </div>
  )
}
