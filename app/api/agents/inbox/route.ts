import { createHash } from 'node:crypto'
import { db } from '../../../../server/db.ts'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

// Hands over waiting messages once, then removes them. Empty means nothing concerns this agent.
export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const sql = db()
  const [agent] = await sql`select id from agents where token_hash = ${hashToken(token)}`
  if (!agent) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`delete from agent_inbox where agent_id = ${agent.id} returning message`
  return Response.json({ messages: rows.map((row) => row.message) })
}
