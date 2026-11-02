// Service worker: a helper that runs in the background for offline use and push.
import { readNoticeEvent } from '../lib/signing.ts'

const CACHE = 'griot-v6'
const ICON = '/icons/icon-192.png'

// Saves the page plus every file it references, so offline works after one visit.
async function cacheApp() {
  const cache = await caches.open(CACHE)
  const page = await fetch('/', { cache: 'no-cache' })
  const html = await page.clone().text()
  await cache.put('/', page)
  const assets = html.match(/\/_next\/static\/[^"'\\\s)]+/g) ?? []
  const extras = ['/manifest.webmanifest', '/icons/icon-192.png']
  await Promise.allSettled([...new Set([...assets, ...extras])].map((url) => cache.add(url)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheApp().then(() => self.skipWaiting()))
})

// Old versions of the app are removed once this one takes over.
async function activate() {
  const names = await caches.keys()
  await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
  await self.clients.claim()
}

self.addEventListener('activate', (event) => {
  event.waitUntil(activate())
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone())
  return response
}

// Pages use the network when possible and the saved copy when offline.
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    // Only the app page itself becomes the offline copy.
    const isAppPage = new URL(request.url).pathname === '/' && !response.redirected
    if (response.ok && isAppPage) (await caches.open(CACHE)).put('/', response.clone())
    return response
  } catch {
    return caches.match('/')
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') return event.respondWith(networkFirst(event.request))
  // File names under /_next/static change with content, so saved copies stay correct.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(event.request))
  }
})

function show(title, options) {
  return self.registration.showNotification(title, { icon: ICON, badge: ICON, ...options })
}

// A push only shows its words if our seal checks out, so a hacked server can't fake one.
async function showPush(event) {
  let message = {}
  try {
    message = event.data?.json() ?? {}
  } catch {
    // A bad payload falls through to the harmless line below.
  }

  if (message.type === 'weekly') {
    return show('Griot', {
      body: 'Your weekly report is ready.',
      tag: 'weekly-report',
      data: { url: '/#/report' },
    })
  }

  const notice = readNoticeEvent(message.notice, ALERT_PUBKEY, new Date())
  if (!notice) {
    return show('Griot', {
      body: 'Open the app to check for updates.',
      tag: 'check-updates',
      data: { url: '/' },
    })
  }

  if (notice.correction) {
    return show('Correction', { body: notice.title, tag: notice.id, data: { url: `/#/alert/${notice.id}` } })
  }

  const urgent = notice.risk === 'high'
  const label = urgent ? 'Act now' : 'Act soon'
  return show(message.stage > 0 ? `Reminder: ${label.toLowerCase()}` : label, {
    body: notice.title,
    tag: notice.id,
    renotify: true,
    requireInteraction: urgent,
    vibrate: urgent ? [300, 150, 300, 150, 600] : undefined,
    actions: urgent ? [{ action: 'seen', title: "I've seen this" }] : [],
    data: { url: `/#/alert/${notice.id}`, alertId: notice.id },
  })
}

self.addEventListener('push', (event) => {
  event.waitUntil(showPush(event))
})

async function markSeen(alertId) {
  const subscription = await self.registration.pushManager.getSubscription()
  if (!subscription) return
  await fetch('/api/push/seen', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint, alert_id: alertId }),
  })
}

// Tapping opens the right screen, reusing a window that is already open.
async function openApp(url) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  if (!windows[0]) return self.clients.openWindow(url)
  await windows[0].focus()
  windows[0].postMessage({ type: 'open', url })
}

self.addEventListener('notificationclick', (event) => {
  const { url = '/', alertId } = event.notification.data ?? {}
  event.notification.close()
  event.waitUntil(event.action === 'seen' ? markSeen(alertId) : openApp(url))
})
