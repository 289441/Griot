import { RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const TRIGGER_PX = 70
const MAX_PX = 110
const RESISTANCE = 0.5

// Pull down from the top of the page to fetch new alerts, like most phone apps.
export default function PullToRefresh({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const [pull, setPull] = useState(0)
  const start = useRef<number | null>(null)
  const pullRef = useRef(0)

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      start.current = window.scrollY <= 0 && !refreshing ? event.touches[0].clientY : null
    }
    const onMove = (event: TouchEvent) => {
      if (start.current === null) return
      const distance = (event.touches[0].clientY - start.current) * RESISTANCE
      if (distance <= 0) return
      // Stops the page bouncing while the pull is shown instead.
      event.preventDefault()
      pullRef.current = Math.min(distance, MAX_PX)
      setPull(pullRef.current)
    }
    const onEnd = () => {
      if (start.current !== null && pullRef.current >= TRIGGER_PX) onRefresh()
      start.current = null
      pullRef.current = 0
      setPull(0)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [refreshing, onRefresh])

  const shown = refreshing ? TRIGGER_PX : pull
  const ready = pull >= TRIGGER_PX

  return (
    <div
      aria-hidden={!refreshing}
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-[env(safe-area-inset-top)]"
      style={{ transform: `translateY(${shown - 48}px)`, opacity: shown ? 1 : 0, transition: pull ? 'none' : 'transform 200ms, opacity 200ms' }}
    >
      <span
        role="status"
        className="flex items-center gap-2 rounded-pill bg-surface px-4 py-2 text-sm font-bold text-ink shadow-elev-2"
      >
        <RefreshCw
          size={16}
          aria-hidden
          className={refreshing ? 'animate-spin text-accent-ink' : 'text-muted'}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
        />
        {refreshing ? 'Updating' : ready ? 'Let go to update' : 'Pull to update'}
      </span>
    </div>
  )
}
