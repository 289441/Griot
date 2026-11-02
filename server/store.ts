// Saves anonymous push subscriptions with their broad topics. Nothing else.
import { db } from './db.ts'

export interface Subscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
  country: string
  holdings: string[]
}

const MAX_SUBSCRIPTIONS = 100_000

const toSubscription = (row: Record<string, string & string[]>): Subscription => ({
  endpoint: row.endpoint,
  keys: { p256dh: row.p256dh, auth: row.auth },
  country: row.country,
  holdings: row.holdings,
})

export async function listSubscriptions(): Promise<Subscription[]> {
  const rows = await db()`select * from push_subscriptions`
  return rows.map((row) => toSubscription(row))
}

// Everyone whose country and types of money match an alert.
export async function matchingSubscriptions(countries: string[], affects: string[]) {
  const sql = db()
  const everywhere = countries.includes('*')
  const rows = await sql`
    select * from push_subscriptions
    where holdings && ${affects}::text[]
      and (${everywhere} or country = any(${countries}::text[]))`
  return rows.map((row) => toSubscription(row))
}

// Returns false when the list is full, which stops anyone filling the store.
export async function addSubscription(subscription: Subscription): Promise<boolean> {
  const { endpoint, keys, country, holdings } = subscription
  const sql = db()
  const [{ count }] = await sql`select count(*)::int as count from push_subscriptions`
  if (count >= MAX_SUBSCRIPTIONS) return false
  await sql`
    insert into push_subscriptions (endpoint, p256dh, auth, country, holdings)
    values (${endpoint}, ${keys.p256dh}, ${keys.auth}, ${country}, ${holdings}::text[])
    on conflict (endpoint) do update set
      p256dh = excluded.p256dh, auth = excluded.auth,
      country = excluded.country, holdings = excluded.holdings`
  return true
}

export async function removeSubscriptions(endpoints: string[]): Promise<void> {
  if (!endpoints.length) return
  const sql = db()
  await sql`delete from push_subscriptions where endpoint in ${sql(endpoints)}`
}
