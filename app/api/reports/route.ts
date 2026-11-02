import { createHash, randomBytes } from 'node:crypto'
import { signerOf } from '../../../lib/reporter.ts'
import { checkWork, REPORT_BITS, workHash } from '../../../lib/work.ts'
import { db } from '../../../server/db.ts'
import { readJson } from '../../../server/validate.ts'

const MAX_BODY = 2000
const MAX_LINKS = 5
const MAX_WAITING = 2000

const isHttps = (value: unknown) => {
  try {
    return typeof value === 'string' && value.length < 500 && new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const receiptCode = () => {
  const code = randomBytes(10).toString('hex').toUpperCase()
  return `${code.slice(0, 5)}-${code.slice(5, 10)}-${code.slice(10, 15)}-${code.slice(15)}`
}

// A report needs proof of work, not an account. No IP address or time is stored.
export async function POST(request: Request) {
  const input = (await readJson(request)) as Record<string, unknown> | null
  const body = typeof input?.body === 'string' ? input.body.trim() : ''
  const links = Array.isArray(input?.links) ? input.links : []
  if (body.length < 10 || body.length > MAX_BODY || links.length > MAX_LINKS || !links.every(isHttps)) {
    return Response.json({ error: 'Invalid report' }, { status: 400 })
  }

  const payload = JSON.stringify({ body, links })
  const now = new Date()
  if (!checkWork('report', payload, input?.nonce, now, REPORT_BITS)) {
    return Response.json({ error: 'Invalid work' }, { status: 400 })
  }

  // A signed report comes from a pen name. No signature means anonymous.
  const reporter = input?.signed ? signerOf(input.signed, payload, now) : null
  if (input?.signed && !reporter) return Response.json({ error: 'Bad signature' }, { status: 400 })

  const sql = db()
  const [{ count }] = await sql`select count(*)::int as count from reports where status = 'pending'`
  if (count >= MAX_WAITING) return Response.json({ error: 'Busy' }, { status: 503 })
  if (reporter) {
    const [known] = await sql`select pubkey from reporters where pubkey = ${reporter}`
    if (!known) return Response.json({ error: 'Create a reporter name first' }, { status: 400 })
  }

  const code = receiptCode()
  const receiptHash = createHash('sha256').update(code).digest('hex')
  const done = await sql`
    insert into reports (receipt_hash, work_hash, reporter, body, links)
    values (${receiptHash}, ${workHash('report', payload, input?.nonce as number)}, ${reporter},
      ${body}, ${links as string[]}::text[])
    on conflict (work_hash) do nothing returning id`
  if (!done.length) return Response.json({ error: 'Already sent' }, { status: 409 })
  return Response.json({ receipt: code }, { status: 201 })
}
