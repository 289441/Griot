// Works out how this device installs the app.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

let installPrompt: InstallPromptEvent | null = null

// Android and desktop Chrome fire this once, so we keep it for the Install button.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt = event as InstallPromptEvent
  })
}

export const canPromptInstall = () => installPrompt !== null

export async function promptInstall() {
  await installPrompt?.prompt()
  installPrompt = null
}

// Newer iPads pretend to be Macs, so touch support gives them away.
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true
