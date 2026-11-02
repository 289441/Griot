// Screens live after the # in the address, so one saved page works fully offline.
import { useSyncExternalStore } from 'react'

function subscribe(listen: () => void) {
  window.addEventListener('hashchange', listen)
  return () => window.removeEventListener('hashchange', listen)
}

const getPath = () => window.location.hash.replace(/^#\/?/, '')

export const useRoute = () => useSyncExternalStore(subscribe, getPath, () => '')

export const go = (path: string) => {
  window.location.hash = `/${path}`
}
