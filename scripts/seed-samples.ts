// Signs the sample alerts and saves them, so a fresh copy has something to show.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { hexToBytes } from 'nostr-tools/utils'
import postgres from 'postgres'
import { parseFeed } from '../lib/feed.ts'
import { signAlert } from '../lib/signing.ts'

const envFile = fileURLToPath(new URL('../.env.local', import.meta.url))
if (existsSync(envFile)) process.loadEnvFile(envFile)

const samples = JSON.parse(readFileSync(new URL('./sample-alerts.json', import.meta.url), 'utf8'))
const { feed, problems } = parseFeed(samples)
if (problems.length) throw new Error(problems.join('\n'))

const secretKey = hexToBytes(process.env.ALERT_SIGNING_KEY!)
const sql = postgres(process.env.DATABASE_URL!, { max: 1 })

for (const alert of feed.alerts) {
  const event = signAlert(alert, secretKey)
  await sql`
    insert into alerts (id, event) values (${alert.id}, ${sql.json(JSON.parse(JSON.stringify(event)))})
    on conflict (id) do update set event = excluded.event`
}

await sql.end()
console.log(`Signed and saved ${feed.alerts.length} sample alerts.`)
