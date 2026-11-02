import { createHash } from 'node:crypto'
import { db } from '../../../../server/db.ts'
import { readJson } from '../../../../server/validate.ts'

// Only the person holding the receipt can see what happened to their report.
export async function POST(request: Request) {
  const input = (await readJson(request)) as { code?: unknown } | null
  if (typeof input?.code !== 'string') return Response.json({ error: 'Invalid' }, { status: 400 })
  const hash = createHash('sha256').update(input.code.trim().toUpperCase()).digest('hex')
  const [row] = await db()`select status, reason, alert_id from reports where receipt_hash = ${hash}`
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}
