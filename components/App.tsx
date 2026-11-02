'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { isIOS, isInstalled } from '../lib/install.ts'
import { syncTopics } from '../lib/push.ts'
import { go, useRoute } from '../lib/router.ts'
import { useData } from '../lib/storage.ts'
import { refreshFeed } from '../lib/sync.ts'
import AlertDetail from './AlertDetail.tsx'
import { AgentPage, CheckPage, LegalPage } from './ExtraPages.tsx'
import Home from './Home.tsx'
import InstallPage from './InstallPage.tsx'
import More from './More.tsx'
import NavBar from './NavBar.tsx'
import PlanPage from './PlanPage.tsx'
import PullToRefresh from './PullToRefresh.tsx'
import ProfilePage from './ProfilePage.tsx'
import Report from './Report.tsx'
import ReporterPage from './ReporterPage.tsx'
import { AlarmStep, MoneyStep, PlaceStep } from './Setup.tsx'
import TellUs from './TellUs.tsx'
import Welcome from './Welcome.tsx'

const HOUR_MS = 60 * 60 * 1000
const noSubscribe = () => () => {}

// The server page is an empty shell, because the data exists only in the browser.
export default function App() {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false)
  return inBrowser ? <Main /> : <div className="min-h-dvh bg-[#0f1430]" />
}

function Main() {
  const data = useData()
  const route = useRoute()
  const [online, setOnline] = useState(true)
  const [skippedInstall, setSkippedInstall] = useState(false)
  const [country, setCountry] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const hasProfile = data.profile !== null

  // A pull or a tap on Refresh fetches the feed now, instead of waiting.
  const refreshNow = useCallback(async () => {
    setRefreshing(true)
    setOnline(await refreshFeed())
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  // Fetches the newest feed on opening and when returning after a while.
  useEffect(() => {
    if (!hasProfile) return
    const refresh = () => refreshFeed().then(setOnline)
    refresh()
    // Re-registers this device, so the server can't silently forget an alarm that's on.
    syncTopics().catch(() => {})
    let lastRefresh = Date.now()
    const onFocus = () => {
      if (Date.now() - lastRefresh < HOUR_MS) return
      lastRefresh = Date.now()
      refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [hasProfile])

  // A tapped notification lands here when the app is already open.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'open') return
      refreshFeed().then(setOnline)
      window.location.hash = String(event.data.url).replace(/^\/#?/, '')
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  // Braces matter: React would run anything returned here as a cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const [screen, param] = route.split('/')

  // These pages stay open to everyone, even before setup.
  if (screen === 'privacy' || screen === 'terms') return <LegalPage kind={screen} />

  // Setup steps live in the address too, so the back arrow steps back through them.
  if (!data.profile) {
    if (screen !== 'start' && screen !== 'money') return <Welcome onStart={() => go('start')} />
    // iPhones keep Home Screen apps separate from Safari, so install comes first there.
    if (isIOS() && !isInstalled() && !skippedInstall) {
      return <InstallPage onDone={() => setSkippedInstall(true)} />
    }
    if (screen === 'money' && country) return <MoneyStep country={country} onBack={() => history.back()} />
    return (
      <PlaceStep
        country={country}
        onPick={(picked) => {
          setCountry(picked)
          go('money')
        }}
      />
    )
  }
  if (!data.notifyPromptSeen) return <AlarmStep />

  const alerts = data.lastFeed?.alerts ?? []

  return (
    <div className="min-h-dvh">
      <PullToRefresh refreshing={refreshing} onRefresh={refreshNow} />
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:m-2 focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-28">
        {!online && data.lastFeed && (
          <p role="status" className="rounded-pill bg-sunken px-4 py-2 text-center text-sm text-muted">
            Offline. Showing saved alerts.
          </p>
        )}
        {alerts.some((alert) => alert.sample) && (
          <p className="rounded-pill bg-warn-soft px-4 py-2 text-center text-sm font-bold">
            Sample alerts. Not real.
          </p>
        )}
        {screen === 'report' ? (
          <Report alerts={alerts} data={data} profile={data.profile} />
        ) : screen === 'plan' ? (
          <PlanPage data={data} />
        ) : screen === 'tell' ? (
          <TellUs data={data} />
        ) : screen === 'more' ? (
          <More />
        ) : screen === 'profile' ? (
          <ProfilePage profile={data.profile} />
        ) : screen === 'install' ? (
          <InstallPage embedded />
        ) : screen === 'check' ? (
          <CheckPage alerts={alerts} />
        ) : screen === 'agent' ? (
          <AgentPage profile={data.profile} />
        ) : screen === 'reporter' ? (
          <ReporterPage pubkey={param} data={data} />
        ) : screen === 'alert' ? (
          <AlertDetail id={param} alerts={alerts} data={data} profile={data.profile} />
        ) : (
          <Home alerts={alerts} data={data} profile={data.profile} refreshing={refreshing} onRefresh={refreshNow} />
        )}
      </main>
      <NavBar route={screen} />
    </div>
  )
}
