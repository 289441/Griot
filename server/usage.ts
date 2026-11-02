// Adds one to today's total for an event. Nothing about the sender is kept.
import type { UsageEvent } from '../lib/usage.ts'
import { db } from './db.ts'

// Returns false when the token was already used, so replays add nothing.
export async function addCount(event: UsageEvent, token: string): Promise<boolean> {
  const sql = db()
  return sql.begin(async (tx) => {
    await tx`delete from usage_tokens where made_on < current_date - 1`
    const [fresh] = await tx`
      insert into usage_tokens (token) values (${token})
      on conflict do nothing returning token`
    if (!fresh) return false
    await tx`
      insert into usage_counts (day, event, count) values (current_date, ${event}, 1)
      on conflict (day, event) do update set count = usage_counts.count + 1`
    return true
  })
}
