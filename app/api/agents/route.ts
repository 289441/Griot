import { createHash, randomBytes } from 'node:crypto'
import { COUNTRIES, HOLDINGS } from '../../../lib/options.ts'
import { AGENT_BITS, checkWork, workHash } from '../../../lib/work.ts'
import { db } from '../../../server/db.ts'
import { isSafeHookUrl } from '../../../server/hooks.ts'
import { readJson } from '../../../server/validate.ts'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

// Connects an agent. The token is shown once and only its hash is kept.
export async function POST(request: Request) {
  const input = (await readJson(request)) as Record<string, unknown> | null
  const url = input?.url ? input.url : null
  const country = input?.country
  const holdings = input?.holdings
  if (
    (url !== null && !isSafeHookUrl(url)) ||
    typeof country !== 'string' ||
    !(country in COUNTRIES) ||
    !Array.isArray(holdings) ||
    !holdings.length ||
    !holdings.every((holding) => holding in HOLDINGS)
  ) {
    return Response.json({ error: 'Invalid agent' }, { status: 400 })
  }

  const payload = JSON.stringify({ url, country, holdings })
  if (!checkWork('agent', payload, input?.nonce, new Date(), AGENT_BITS)) {
    return Response.json({ error: 'Invalid work' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')
  const done = await db()`
    insert into agents (token_hash, work_hash, url, country, holdings)
    values (${hashToken(token)}, ${workHash('agent', payload, input?.nonce as number)}, ${url as string | null},
      ${country}, ${holdings as string[]}::text[])
    on conflict (work_hash) do nothing returning id`
  if (!done.length) return Response.json({ error: 'Already sent' }, { status: 409 })
  return Response.json({ token }, { status: 201 })
}

// Disconnects an agent and forgets it.
export async function DELETE(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const gone = await db()`delete from agents where token_hash = ${hashToken(token)} returning id`
  return Response.json({ ok: gone.length > 0 }, { status: gone.length ? 200 : 404 })
}
