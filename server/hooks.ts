// Calls an agent's web address safely, so nobody can aim us at private machines.
import { lookup } from 'node:dns'
import { request } from 'node:https'
import { isIP, type LookupFunction } from 'node:net'

const TIMEOUT_MS = 5000

export function isPrivateAddress(address: string) {
  const ip = address.toLowerCase().replace(/^::ffff:/, '')
  if (isIP(ip) === 6) return ip === '::1' || ip === '::' || /^(fc|fd|fe[89ab])/.test(ip)
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

export function isSafeHookUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 500) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return false
    return !isIP(url.hostname.replace(/[[\]]/g, '')) && url.hostname !== 'localhost'
  } catch {
    return false
  }
}

// Checks the real address at connection time, so a changing DNS answer can't trick us.
const safeLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, '', 0)
    const safe = addresses.find(({ address }) => !isPrivateAddress(address))
    if (!safe || addresses.some(({ address }) => isPrivateAddress(address))) {
      return callback(new Error('Private address refused'), '', 0)
    }
    if (options.all) return callback(null, [safe])
    callback(null, safe.address, safe.family)
  })
}

// Never follows redirects, and ignores anything the agent sends back.
export function callHook(url: string, message: object): Promise<boolean> {
  return new Promise((resolve) => {
    const body = JSON.stringify(message)
    const call = request(
      url,
      {
        method: 'POST',
        lookup: safeLookup,
        timeout: TIMEOUT_MS,
        headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
      },
      (response) => {
        response.resume()
        resolve((response.statusCode ?? 500) < 300)
      },
    )
    call.on('timeout', () => call.destroy())
    call.on('error', () => resolve(false))
    call.end(body)
  })
}
