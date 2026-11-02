// Sends pushes and agent messages: instant alerts, reminders, corrections and the weekly report.
import webpush from 'web-push'
import { readAlertEvent, readNoticeEvent } from '../lib/signing.ts'
import type { Alert } from '../lib/types.ts'
import { db } from './db.ts'
import { callHook } from './hooks.ts'
import { listSubscriptions, matchingSubscriptions, removeSubscriptions } from './store.ts'
import type { Subscription } from './store.ts'

const ONE_DAY_IN_SECONDS = 24 * 60 * 60
const BATCH_SIZE = 100
const HOOK_BATCH_SIZE = 20
const REMINDER_MINUTES = 15
const LAST_STAGE = 2
const WAITING_LIMIT = 20
const ROUND_SIZE = 1000
const TIME_BUDGET_MS = 45_000

function setKeys() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
}

async function sendAll(subscriptions: Subscription[], message: object, urgent: boolean) {
  const payload = JSON.stringify(message)
  const expired: string[] = []
  let sent = 0
  let failed = 0

  // Batches keep this inside the short time limit of a serverless function.
  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((subscription) =>
        webpush.sendNotification(subscription, payload, {
          TTL: ONE_DAY_IN_SECONDS,
          urgency: urgent ? 'high' : 'normal',
        }),
      ),
    )
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') sent += 1
      else if ([404, 410].includes(result.reason?.statusCode)) expired.push(batch[index].endpoint)
      else {
        failed += 1
        console.error('Push failed:', result.reason?.statusCode ?? result.reason?.message)
      }
    })
  }

  // 404 and 410 mean the device unsubscribed, so we forget it.
  await removeSubscriptions(expired)
  return { sent, expired: expired.length, failed }
}

export async function sendWeekly() {
  setKeys()
  return sendAll(await listSubscriptions(), { type: 'weekly' }, false)
}

// Agents get fixed fields and a fixed action. Reporter words never reach them.
async function tellAgents(alert: Alert, notice: object) {
  const sql = db()
  const agents = await sql`
    select id, url from agents
    where holdings && ${alert.affects}::text[]
      and (${alert.countries.includes('*')} or country = any(${alert.countries}::text[]))`
  if (!agents.length) return

  const message = {
    alert_id: alert.id,
    risk: alert.risk,
    status: alert.status,
    category: alert.category ?? null,
    affects: alert.affects,
    action: 'tell_owner',
    notice,
  }
  await sql`
    insert into agent_inbox (agent_id, message)
    select unnest(${agents.map((agent) => agent.id)}::uuid[]), ${sql.json(message)}`

  const hooks = agents.filter((agent) => agent.url)
  for (let i = 0; i < hooks.length; i += HOOK_BATCH_SIZE) {
    await Promise.allSettled(
      hooks.slice(i, i + HOOK_BATCH_SIZE).map((agent) => callHook(agent.url, message)),
    )
  }
}

// Sends anything newly published or raised. Only sealed alerts ever go out.
async function deliverWaiting() {
  const sql = db()
  const pubkey = process.env.NEXT_PUBLIC_ALERT_PUBKEY!
  const rows = await sql`
    select id, event, notice, target_rank from alerts
    where notice is not null and delivered_rank < target_rank
    order by target_rank desc limit ${WAITING_LIMIT}`
  let delivered = 0

  for (const row of rows) {
    const alert = readAlertEvent(row.event, pubkey)
    const notice = readNoticeEvent(row.notice, pubkey, new Date())
    if (!alert || !notice) continue

    // Claiming first means two runs at once can't double send.
    const claimed = await sql`
      update alerts set delivered_rank = ${row.target_rank}
      where id = ${alert.id} and delivered_rank < ${row.target_rank} returning id`
    if (!claimed.length) continue

    // Every device gets a row first, so nobody is lost if this run gets cut off.
    const targets = await matchingSubscriptions(alert.countries, alert.affects)
    const endpoints = targets.map((target) => target.endpoint)
    const lastStage = alert.risk === 'high' ? LAST_STAGE : 0
    await sql`
      insert into reminders (alert_id, endpoint, stage, next_at, last_stage)
      select ${alert.id}, unnest(${endpoints}::text[]), 0, now(), ${lastStage}
      on conflict do nothing`
    await tellAgents(alert, row.notice)
    delivered += targets.length
  }
  return delivered
}

// Tells everyone who got an alert that it changed, and stops its reminders.
async function deliverCorrections() {
  const sql = db()
  const pubkey = process.env.NEXT_PUBLIC_ALERT_PUBKEY!
  const rows = await sql`select id, event, notice from alerts where correction_pending limit ${WAITING_LIMIT}`
  let corrected = 0

  for (const row of rows) {
    const alert = readAlertEvent(row.event, pubkey)
    const notice = readNoticeEvent(row.notice, pubkey, new Date())
    if (!alert || !notice?.correction) continue
    const claimed = await sql`
      update alerts set correction_pending = false
      where id = ${alert.id} and correction_pending returning id`
    if (!claimed.length) continue

    await sql`delete from reminders where alert_id = ${alert.id}`
    const targets = await matchingSubscriptions(alert.countries, alert.affects)
    await sendAll(targets, { notice: row.notice, stage: 0 }, false)
    await tellAgents(alert, row.notice)
    corrected += targets.length
  }
  return corrected
}

// Sends everything due, grouped so thousands of devices go out in batches.
async function sendDue() {
  const sql = db()
  const due = await sql`
    select r.alert_id, r.stage, r.last_stage, a.notice, s.endpoint, s.p256dh, s.auth, s.country, s.holdings
    from reminders r
    join alerts a on a.id = r.alert_id
    join push_subscriptions s on s.endpoint = r.endpoint
    where r.next_at <= now()
    order by r.stage, r.next_at
    limit ${ROUND_SIZE}`

  const groups = new Map<string, (typeof due)[number][]>()
  for (const row of due) {
    const key = `${row.alert_id}|${row.stage}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  for (const rows of groups.values()) {
    const [{ alert_id: alertId, stage, notice, last_stage: lastStage }] = rows
    const subscriptions = rows.map((row) => ({
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
      country: row.country,
      holdings: row.holdings,
    }))
    await sendAll(subscriptions, { notice, stage }, true)

    const endpoints = rows.map((row) => row.endpoint)
    if (stage >= lastStage) {
      await sql`delete from reminders where alert_id = ${alertId} and endpoint = any(${endpoints}::text[])`
    } else {
      await sql`
        update reminders set stage = stage + 1,
          next_at = now() + ${REMINDER_MINUTES} * interval '1 minute'
        where alert_id = ${alertId} and endpoint = any(${endpoints}::text[])`
    }
  }
  return due.length
}

export async function tick() {
  setKeys()
  const started = Date.now()
  const delivered = await deliverWaiting()
  const corrected = await deliverCorrections()

  // Rounds stop in time, and the next tick picks up whatever is left.
  let sent = 0
  while (Date.now() - started < TIME_BUDGET_MS) {
    const count = await sendDue()
    sent += count
    if (count < ROUND_SIZE) break
  }
  return { delivered, corrected, sent }
}

export async function markSeen(alertId: string, endpoint: string) {
  await db()`delete from reminders where alert_id = ${alertId} and endpoint = ${endpoint}`
}
