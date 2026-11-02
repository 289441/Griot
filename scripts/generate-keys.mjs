// Creates local settings: push keys, the cron secret and the alert signing key.
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { bytesToHex } from 'nostr-tools/utils'
import webpush from 'web-push'

const ENV_FILE = fileURLToPath(new URL('../.env.local', import.meta.url))
if (!existsSync(ENV_FILE)) writeFileSync(ENV_FILE, '', { mode: 0o600 })
const current = readFileSync(ENV_FILE, 'utf8')

// Existing keys stay, because new ones would break subscriptions and old signatures.
function add(values) {
  const missing = Object.entries(values).filter(([name]) => !current.includes(`${name}=`))
  for (const [name, value] of missing) appendFileSync(ENV_FILE, `${name}=${value}\n`)
  return missing.length
}

const push = webpush.generateVAPIDKeys()
const signing = generateSecretKey()

let added = 0
if (!current.includes('VAPID_PRIVATE_KEY=')) {
  added += add({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: push.publicKey,
    VAPID_PRIVATE_KEY: push.privateKey,
  })
}
if (!current.includes('ALERT_SIGNING_KEY=')) {
  added += add({
    NEXT_PUBLIC_ALERT_PUBKEY: getPublicKey(signing),
    ALERT_SIGNING_KEY: bytesToHex(signing),
  })
}
added += add({
  VAPID_SUBJECT: 'mailto:change-me@example.com',
  CRON_SECRET: randomBytes(32).toString('hex'),
  DATABASE_URL: 'postgres://freedom:freedom@localhost:5433/freedom',
})

console.log(added ? `Added ${added} settings to .env.local.` : '.env.local already has everything.')
