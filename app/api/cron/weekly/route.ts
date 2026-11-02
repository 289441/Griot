import { hasCronSecret } from '../../../../server/auth.ts'
import { sendWeekly } from '../../../../server/send.ts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Vercel calls this every Monday. Without the secret, nobody can message users.
export async function GET(request: Request) {
  if (!hasCronSecret(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json(await sendWeekly())
}
