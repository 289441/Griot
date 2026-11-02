import { hasCronSecret } from '../../../../server/auth.ts'
import { tick } from '../../../../server/send.ts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Called right after publishing, and on a schedule so nothing gets missed.
export async function GET(request: Request) {
  if (!hasCronSecret(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json(await tick())
}
