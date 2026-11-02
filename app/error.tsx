'use client'

import { useEffect } from 'react'

// Shown if a screen breaks, so nobody is left with a blank page.
export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="grid min-h-dvh place-content-center justify-items-center gap-4 p-6 text-center">
      <h1 className="font-display text-3xl font-extrabold">Something broke</h1>
      {/* A fresh load clears whatever went wrong, so the button reloads the home screen */}
      <button
        className="rounded-pill bg-accent px-6 py-3 font-bold text-on-accent"
        onClick={() => {
          window.location.hash = '/'
          window.location.reload()
        }}
      >
        Try again
      </button>
      {/* The cause in small print, so a screenshot is enough to report it */}
      <p className="max-w-sm text-xs break-words text-muted">{error.message || error.digest}</p>
    </div>
  )
}
