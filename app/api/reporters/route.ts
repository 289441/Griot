import { NAME_PATTERN, signerOf } from '../../../lib/reporter.ts'
import { checkWork, REPORT_BITS } from '../../../lib/work.ts'
import { db } from '../../../server/db.ts'
import { readJson } from '../../../server/validate.ts'

const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=120'

// The public scoreboard: names and track records, nothing private.
export async function GET() {
  const rows = await db()`
    select pubkey, name, verified, approved, rejected, corrected from reporters
    where approved > 0 or verified order by approved desc limit 200`
  return Response.json({ reporters: rows }, { headers: { 'Cache-Control': PUBLIC_CACHE } })
}

// Claims a name for a key. The key signs the request, so nobody can take over a name.
export async function POST(request: Request) {
  const input = (await readJson(request)) as Record<string, unknown> | null
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const proof = typeof input?.proof_url === 'string' ? input.proof_url.trim() : ''
  if (!NAME_PATTERN.test(name)) return Response.json({ error: 'Invalid name' }, { status: 400 })
  if (proof && (!proof.startsWith('https://') || proof.length > 300)) {
    return Response.json({ error: 'Invalid link' }, { status: 400 })
  }

  const payload = JSON.stringify({ name, proof_url: proof })
  if (!checkWork('reporter', payload, input?.nonce, new Date(), REPORT_BITS)) {
    return Response.json({ error: 'Invalid work' }, { status: 400 })
  }
  const pubkey = signerOf(input?.signed, payload, new Date())
  if (!pubkey) return Response.json({ error: 'Bad signature' }, { status: 400 })

  try {
    await db()`
      insert into reporters (pubkey, name, proof_url) values (${pubkey}, ${name}, ${proof || null})
      on conflict (pubkey) do update set proof_url = excluded.proof_url`
  } catch {
    return Response.json({ error: 'Name taken' }, { status: 409 })
  }
  return Response.json({ ok: true }, { status: 201 })
}
