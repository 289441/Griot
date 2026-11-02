import { db } from '../../../server/db.ts'

export const dynamic = 'force-dynamic'

const NEWEST = 200
const MEMORY_MS = 5000

let saved: { at: number; body: string } | null = null

// Everyone gets the same signed list. Anyone may read and verify it.
// Two short caches protect the database in a crowd, with or without a CDN.
export async function GET() {
  if (!saved || Date.now() - saved.at > MEMORY_MS) {
    const rows = await db()`select event from alerts order by published_at desc limit ${NEWEST}`
    saved = { at: Date.now(), body: JSON.stringify({ events: rows.map((row) => row.event) }) }
  }
  return new Response(
    saved.body,
    {
      headers: {
        'content-type': 'application/json',
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
