import { db } from '../../../server/db.ts'

export const dynamic = 'force-dynamic'

// For uptime monitors. Shows only whether things work.
export async function GET() {
  try {
    await db()`select 1`
    return Response.json({ status: 'ok', database: 'ok' })
  } catch {
    return Response.json({ status: 'error', database: 'unreachable' }, { status: 503 })
  }
}
