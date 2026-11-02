// Spam protection with no IP addresses: each request costs the sender a little computing.
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'

export const SUBSCRIBE_BITS = 12
export const REPORT_BITS = 16
export const AGENT_BITS = 16

const DAY_MS = 24 * 60 * 60 * 1000
const SLICE = 2048

const dayOf = (now: Date) => Math.floor(now.getTime() / DAY_MS)

function zeroBits(hash: Uint8Array) {
  let bits = 0
  for (const byte of hash) {
    if (byte === 0) {
      bits += 8
      continue
    }
    return bits + Math.clz32(byte) - 24
  }
  return bits
}

const hashWork = (purpose: string, payload: string, day: number, nonce: number) =>
  sha256(utf8ToBytes(`${purpose}:${day}:${payload}:${nonce}`))

// The sender's job: find a number that makes the hash start with enough zeros.
export async function doWork(purpose: string, payload: string, now: Date, bits: number) {
  const day = dayOf(now)
  for (let nonce = 0; ; nonce += 1) {
    if (zeroBits(hashWork(purpose, payload, day, nonce)) >= bits) return nonce
    // Short pauses keep the screen responsive on cheap phones.
    if (nonce % SLICE === SLICE - 1) await new Promise((resolve) => setTimeout(resolve))
  }
}

// The server's job: check it in one step. Today and yesterday both count, for midnight.
export function checkWork(
  purpose: string,
  payload: string,
  nonce: unknown,
  now: Date,
  bits: number,
) {
  if (!Number.isSafeInteger(nonce) || (nonce as number) < 0) return false
  const today = dayOf(now)
  return [today, today - 1].some(
    (day) => zeroBits(hashWork(purpose, payload, day, nonce as number)) >= bits,
  )
}

export const workHash = (purpose: string, payload: string, nonce: number) =>
  bytesToHex(sha256(utf8ToBytes(`${purpose}:${payload}:${nonce}`)))
