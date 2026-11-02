// Turns alerts on and off for this device.
import { isIOS, isInstalled } from './install.ts'
import { readData } from './storage.ts'
import { doWork, SUBSCRIBE_BITS } from './work.ts'

export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on'

const supported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export async function getPushState(): Promise<PushState> {
  // iPhones only offer push once the app is on the Home Screen.
  if (isIOS() && !isInstalled()) return 'needs-install'
  if (!supported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  return subscription ? 'on' : 'off'
}

// Push keys are text but browsers want raw bytes.
function keyToBytes(key: string) {
  const base64 = key.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

// Saves this device with only the broad topics it needs alerts for.
async function saveSubscription(subscription: PushSubscription) {
  const { country = 'OTHER', holdings = [] } = readData().profile ?? {}
  const nonce = await doWork('subscribe', subscription.endpoint, new Date(), SUBSCRIBE_BITS)
  return fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...subscription.toJSON(), country, holdings, nonce }),
  }).catch(() => null)
}

async function currentSubscription() {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

// Keeps topics right after someone edits their profile.
export async function syncTopics() {
  const subscription = await currentSubscription()
  if (subscription) await saveSubscription(subscription)
}

// Stops reminders for this alert on this device.
export async function markSeen(alertId: string) {
  const subscription = await currentSubscription()
  if (!subscription) return
  const registration = await navigator.serviceWorker.getRegistration()
  const showing = await registration?.getNotifications({ tag: alertId })
  showing?.forEach((notification) => notification.close())
  await fetch('/api/push/seen', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint, alert_id: alertId }),
  }).catch(() => null)
}

// Must run from a button tap, because browsers block surprise permission popups.
export async function enablePush(): Promise<PushState> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) throw new Error('Push keys are not set up yet. Run "npm run keys".')

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) throw new Error('Notifications need the built app, not dev mode.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const ready = await navigator.serviceWorker.ready
  await (await ready.pushManager.getSubscription())?.unsubscribe()
  const subscription = await ready.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyToBytes(key),
  })

  const response = await saveSubscription(subscription)

  // Undo locally if the server never got it, so the switch tells the truth.
  if (!response?.ok) {
    await subscription.unsubscribe()
    throw new Error('Could not reach the notification service. Try again later.')
  }
  return 'on'
}

// Returns false if the server could not be told. The browser side still turns off.
export async function disablePush(): Promise<boolean> {
  const subscription = await currentSubscription()
  if (!subscription) return true

  const response = await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => null)
  await subscription.unsubscribe()
  return response?.ok ?? false
}
