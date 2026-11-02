// Triggers the weekly push by hand against the app running on your laptop.
import { fileURLToPath } from 'node:url'

process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)))

const url = process.env.APP_URL ?? 'http://localhost:3000'
const response = await fetch(`${url}/api/cron/weekly`, {
  headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
})
console.log(response.status, await response.text())
