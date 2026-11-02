// Wakes the running app every minute so reminders go out locally, like tick.yml does online.
import { fileURLToPath } from 'node:url'

process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)))

const url = process.env.APP_URL ?? 'http://localhost:3000'
const MINUTE_MS = 60_000

async function tick() {
  try {
    const response = await fetch(`${url}/api/cron/tick`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    console.log(new Date().toLocaleTimeString(), response.status, await response.text())
  } catch (error) {
    console.log(new Date().toLocaleTimeString(), 'App not reachable:', error.message)
  }
}

console.log(`Ticking ${url} every minute. Press Ctrl+C to stop.`)
tick()
setInterval(tick, MINUTE_MS)
