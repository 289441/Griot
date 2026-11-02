// Checks the sample alerts with the same rules as real ones.
import { readFileSync } from 'node:fs'
import { parseFeed } from '../lib/feed.ts'

const file = new URL('./sample-alerts.json', import.meta.url)
const { feed, problems } = parseFeed(JSON.parse(readFileSync(file, 'utf8')))

for (const problem of problems) console.error(`  ${problem}`)
if (problems.length) {
  console.error(`sample-alerts.json has ${problems.length} problem(s).`)
  process.exit(1)
}
console.log(`sample-alerts.json is valid: ${feed.alerts.length} alerts.`)
