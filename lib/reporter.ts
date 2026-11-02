// Reporter identity: a key made on the device, used to sign reports. Nostr compatible.
import { nip19 } from 'nostr-tools'
import { finalizeEvent, generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure'
import { bytesToHex, hexToBytes } from 'nostr-tools/utils'

const REPORT_KIND = 30078
const REPORT_TAG = 'griot-report'
const MAX_AGE_SECONDS = 24 * 60 * 60

export const NAME_PATTERN = /^[\p{L}\p{N} ._-]{2,30}$/u

export const newReporterKey = () => bytesToHex(generateSecretKey())

export const publicKeyOf = (secretHex: string) => getPublicKey(hexToBytes(secretHex))

// The form people save as a backup, starting with nsec.
export const backupKey = (secretHex: string) => nip19.nsecEncode(hexToBytes(secretHex))

export function keyFromBackup(text: string) {
  const decoded = nip19.decode(text.trim())
  if (decoded.type !== 'nsec') throw new Error('Not a reporter key')
  return bytesToHex(decoded.data)
}

export function signPayload(payload: string, secretHex: string, now = new Date()) {
  return finalizeEvent(
    {
      kind: REPORT_KIND,
      created_at: Math.floor(now.getTime() / 1000),
      tags: [['t', REPORT_TAG]],
      content: payload,
    },
    hexToBytes(secretHex),
  )
}

// Returns who signed, or null. The signed words must match exactly what was sent.
export function signerOf(raw: unknown, payload: string, now: Date): string | null {
  const event = raw as ReturnType<typeof signPayload> | null
  if (event?.kind !== REPORT_KIND || event.content !== payload) return null
  if (Math.abs(now.getTime() / 1000 - event.created_at) > MAX_AGE_SECONDS) return null
  try {
    const { id, pubkey, created_at, kind, tags, content, sig } = event
    return verifyEvent({ id, pubkey, created_at, kind, tags, content, sig }) ? pubkey : null
  } catch {
    return null
  }
}
