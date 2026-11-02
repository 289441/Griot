import { removeSubscriptions } from '../../../../server/store.ts'
import { readJson } from '../../../../server/validate.ts'

export async function POST(request: Request) {
  const body = (await readJson(request)) as { endpoint?: unknown } | null
  if (typeof body?.endpoint !== 'string') {
    return Response.json({ error: 'Invalid endpoint' }, { status: 400 })
  }
  await removeSubscriptions([body.endpoint])
  return Response.json({ ok: true })
}
