import { markSeen } from '../../../../server/send.ts'
import { readJson } from '../../../../server/validate.ts'

// Knowing the device's secret push address is what proves this request is genuine.
export async function POST(request: Request) {
  const body = (await readJson(request)) as { endpoint?: unknown; alert_id?: unknown } | null
  if (typeof body?.endpoint !== 'string' || typeof body.alert_id !== 'string') {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
  await markSeen(body.alert_id, body.endpoint)
  return Response.json({ ok: true })
}
