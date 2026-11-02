import {
  Bell,
  Bot,
  ChevronRight,
  Download,
  FileCheck,
  KeyRound,
  Lock,
  MessageCircleQuestion,
  Pencil,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { isInstalled } from '../lib/install.ts'
import { COUNTRIES } from '../lib/options.ts'
import { disablePush, enablePush, getPushState } from '../lib/push.ts'
import type { PushState } from '../lib/push.ts'
import { go } from '../lib/router.ts'
import { exportData, importData, useData, wipeData } from '../lib/storage.ts'
import { btn, btnSevere, row, title } from '../lib/styles.ts'

const PUSH_WORD: Record<PushState, string> = {
  unsupported: 'Not on this browser',
  'needs-install': 'Install first',
  denied: 'Blocked in phone settings',
  off: 'Off',
  on: 'On',
}

export default function More() {
  const { profile } = useData()
  const [push, setPush] = useState<PushState | null>(null)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getPushState().then(setPush)
  }, [])

  async function togglePush() {
    setMessage('')
    try {
      if (push === 'on') {
        await disablePush()
        setPush('off')
      } else {
        setPush(await enablePush())
      }
    } catch (problem) {
      setMessage((problem as Error).message)
    }
  }

  function downloadBackup() {
    const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'griot-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function restoreBackup(file: File | undefined) {
    if (!file) return
    try {
      importData(await file.text())
      setMessage('Backup restored.')
    } catch {
      setMessage('Not a valid backup.')
    }
  }

  // Removes the push subscription first, while we still know this device's address.
  async function deleteEverything() {
    await disablePush().catch(() => false)
    wipeData()
    try {
      localStorage.clear()
    } catch {
      // Nothing was stored.
    }
    // A fresh load returns to the first page with nothing left in memory.
    go('')
    window.location.reload()
  }

  return (
    <div className="grid gap-2.5">
      <h1 className={`${title} mb-1`}>More</h1>
      {message && <p role="status" className="rounded-bubble bg-sunken px-4 py-3 text-sm">{message}</p>}

      <button className={row} onClick={togglePush} disabled={push !== 'on' && push !== 'off'}>
        <Bell size={22} aria-hidden />
        <span className="flex-1">Alarm</span>
        <span className="text-sm text-muted">{push ? PUSH_WORD[push] : ''}</span>
      </button>

      {!isInstalled() && (
        <a className={row} href="#/install">
          <Download size={22} aria-hidden />
          <span className="flex-1">Add to Home Screen</span>
          <ChevronRight className="text-muted" size={20} aria-hidden />
        </a>
      )}

      <a className={row} href="#/profile">
        <Pencil size={22} aria-hidden />
        <span className="flex-1">My country and money</span>
        <span className="text-sm text-muted">{profile ? COUNTRIES[profile.country] : ''}</span>
      </a>

      <a className={row} href="#/check">
        <MessageCircleQuestion size={22} aria-hidden />
        <span className="flex-1">Is this message real?</span>
        <ChevronRight className="text-muted" size={20} aria-hidden />
      </a>

      <a className={row} href="#/agent">
        <Bot size={22} aria-hidden />
        <span className="flex-1">Connect an agent</span>
        <ChevronRight className="text-muted" size={20} aria-hidden />
      </a>

      <button className={row} onClick={downloadBackup}>
        <KeyRound size={22} aria-hidden />
        <span className="flex-1">Save a backup</span>
      </button>

      <button className={row} onClick={() => fileInput.current?.click()}>
        <FileCheck size={22} aria-hidden />
        <span className="flex-1">Restore a backup</span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        aria-label="Backup file"
        onChange={(event) => restoreBackup(event.target.files?.[0])}
      />

      <a className={row} href="#/privacy">
        <Lock size={22} aria-hidden />
        <span className="flex-1">Privacy</span>
        <ChevronRight className="text-muted" size={20} aria-hidden />
      </a>
      <a className={row} href="#/terms">
        <FileCheck size={22} aria-hidden />
        <span className="flex-1">Terms</span>
        <ChevronRight className="text-muted" size={20} aria-hidden />
      </a>

      {confirming ? (
        <div className="mt-2 flex gap-2.5">
          <button className={`${btnSevere} flex-1`} onClick={deleteEverything}>
            Yes, delete
          </button>
          <button className={`${btn} flex-1`} onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className={`${btnSevere} mt-2`} onClick={() => setConfirming(true)}>
          Delete all my data
        </button>
      )}

      <p className="mt-1 text-center text-sm text-muted">Not financial advice.</p>
    </div>
  )
}
