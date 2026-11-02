import { addSubscription } from '../../../../server/store.ts'
import { cleanSubscription, readJson } from '../../../../server/validate.ts'

export async function POST(request: Request) {
  const subscription = cleanSubscription(await readJson(request))
  if (!subscription) return Response.json({ error: 'Invalid subscription' }, { status: 400 })
  if (!(await addSubscription(subscription))) {
    return Response.json({ error: 'Full' }, { status: 503 })
  }
  return Response.json({ ok: true }, { status: 201 })
}
