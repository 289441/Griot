import { describe, expect, it } from 'vitest'
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { isPrivateAddress, isSafeHookUrl } from '../server/hooks.ts'
import { checkMessage } from './checker.ts'
import { readiness } from './plan.ts'
import { backupKey, keyFromBackup, newReporterKey, publicKeyOf, signerOf, signPayload } from './reporter.ts'
import { checkWork, doWork } from './work.ts'
import { alertProblems, parseFeed } from './feed.ts'
import { buildReport, rollSnapshots, weekKey } from './report.ts'
import { alertMatches, computeRisk, stepKey } from './risk.ts'
import { readAlertEvent, readNoticeEvent, readSignedFeed, signAlert, signNotice } from './signing.ts'
import { cleanData, EMPTY_DATA } from './storage.ts'
import type { Alert, AppData, Profile } from './types.ts'
import { updatedAgo } from './words.ts'

const profile: Profile = {
  country: 'NG',
  holdings: ['bank', 'exchange'],
  earning: 'freelance_foreign',
  worry: 'freeze',
}

const alert = (extra: Partial<Alert> = {}): Alert => ({
  id: 'a',
  title: 'Title',
  summary: 'Summary',
  countries: ['NG'],
  affects: ['bank'],
  risk: 'medium',
  actions: ['one', 'two'],
  source_url: 'https://www.cbn.gov.ng/',
  date: '2026-10-29',
  status: 'confirmed',
  ...extra,
})

const data = (extra: Partial<AppData> = {}): AppData => ({ ...EMPTY_DATA, profile, ...extra })

describe('matching', () => {
  it('needs both the country and the money to line up', () => {
    expect(alertMatches(alert(), profile)).toBe(true)
    expect(alertMatches(alert({ countries: ['KE'] }), profile)).toBe(false)
    expect(alertMatches(alert({ affects: ['cash'] }), profile)).toBe(false)
  })

  it('treats a star as every country', () => {
    expect(alertMatches(alert({ countries: ['*'] }), profile)).toBe(true)
  })

  it('also matches on how someone earns', () => {
    const earnerAlert = alert({ affects: ['cash'], earners: ['freelance_foreign'] })
    expect(alertMatches(earnerAlert, profile)).toBe(true)
  })
})

describe('risk', () => {
  it('reaches high from one confirmed high alert', () => {
    expect(computeRisk([alert({ risk: 'high' })], profile, []).level).toBe('high')
  })

  it('counts a rumor as half', () => {
    expect(computeRisk([alert({ risk: 'high', status: 'rumor' })], profile, []).level).toBe('medium')
  })

  it('drops the level as steps get done', () => {
    const risky = alert({ risk: 'high' })
    const done = risky.actions.map((action) => stepKey(risky, action))
    expect(computeRisk([risky], profile, done).level).toBe('low')
  })

  it('is low with no matching alerts', () => {
    expect(computeRisk([], profile, []).level).toBe('low')
  })

  it('stops counting a withdrawn alert', () => {
    expect(alertMatches(alert({ withdrawn: true }), profile)).toBe(false)
  })
})

describe('feed checks', () => {
  it('rejects script links but keeps the good alerts', () => {
    const { feed, problems } = parseFeed({
      alerts: [alert(), alert({ id: 'bad', source_url: 'javascript:alert(1)' })],
    })
    expect(feed.alerts.map((a) => a.id)).toEqual(['a'])
    expect(problems).toHaveLength(1)
  })

  it('rejects repeated ids', () => {
    expect(parseFeed({ alerts: [alert(), alert()] }).problems).toHaveLength(1)
  })

  it('throws when there is no list at all', () => {
    expect(() => parseFeed({})).toThrow()
  })
})

describe('publishing blocks', () => {
  const blocked = (extra: Partial<Alert>) => alertProblems(alert(extra)).length > 0

  it('refuses wallet addresses', () => {
    expect(blocked({ summary: 'Use bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq now' })).toBe(true)
  })

  it('refuses instructions to send funds', () => {
    expect(blocked({ actions: ['Move your coins to this safe address'] })).toBe(true)
  })

  it('refuses requests for recovery words but allows warnings', () => {
    expect(blocked({ actions: ['Enter your recovery words to stay safe'] })).toBe(true)
    expect(blocked({ actions: ['Never type your recovery words into a website'] })).toBe(false)
  })

  it('refuses links in text and unofficial sources', () => {
    expect(blocked({ summary: 'Details at https://evil.example' })).toBe(true)
    expect(blocked({ source_url: 'https://cbn.gov.ng.evil.example/' })).toBe(true)
  })

  it('never lets a rumor be high risk', () => {
    expect(blocked({ risk: 'high', status: 'rumor' })).toBe(true)
  })
})

describe('signing', () => {
  const secret = generateSecretKey()
  const pubkey = getPublicKey(secret)

  it('accepts an alert we signed', () => {
    expect(readAlertEvent(signAlert(alert(), secret), pubkey)?.id).toBe('a')
  })

  it('rejects an alert changed after signing', () => {
    const event = signAlert(alert(), secret)
    const content = event.content.replace('Title', 'Changed')
    expect(readAlertEvent({ ...event, content }, pubkey)).toBeNull()
  })

  it('rejects an alert signed by someone else', () => {
    expect(readAlertEvent(signAlert(alert(), generateSecretKey()), pubkey)).toBeNull()
  })

  it('refuses to sign an unsafe alert', () => {
    expect(() => signAlert(alert({ summary: 'See www.evil.example' }), secret)).toThrow()
  })

  it('accepts a fresh notice and refuses an old replay', () => {
    const sent = new Date('2026-11-01T00:00:00Z')
    const notice = signNotice(alert({ risk: 'high' }), secret, sent)
    expect(readNoticeEvent(notice, pubkey, sent)?.id).toBe('a')
    expect(readNoticeEvent(notice, pubkey, new Date('2026-11-03T00:00:00Z'))).toBeNull()
  })

  it('refuses a changed notice', () => {
    const notice = signNotice(alert({ risk: 'high' }), secret)
    const content = notice.content.replace('Title', 'Fake')
    expect(readNoticeEvent({ ...notice, content }, pubkey, new Date())).toBeNull()
  })

  it('never treats a notice as a full alert', () => {
    expect(readAlertEvent(signNotice(alert(), secret), pubkey)).toBeNull()
  })

  it('keeps sealed alerts and drops the rest of a feed', () => {
    const good = signAlert(alert(), secret)
    const { alerts, rejected } = readSignedFeed({ events: [good, { kind: 1 }] }, pubkey)
    expect(alerts).toHaveLength(1)
    expect(rejected).toBe(1)
  })
})

describe('weekly report', () => {
  const now = new Date('2026-11-01T12:00:00Z')

  it('names weeks by their Monday', () => {
    expect(weekKey(now)).toBe('2026-10-26')
    expect(weekKey(new Date('2026-11-02T00:00:00Z'))).toBe('2026-11-02')
  })

  it('treats recent alerts as new in the first week', () => {
    const old = alert({ id: 'old', date: '2026-01-01' })
    const report = buildReport([alert(), old], data(), profile, now)
    expect(report.changes.map((c) => c.id)).toEqual(['a'])
  })

  it('spots a rumor that became confirmed and an alert that vanished', () => {
    const previous = {
      week: '2026-10-19',
      alerts: {
        a: { title: 'Title', risk: 'medium', status: 'rumor' },
        gone: { title: 'Gone', risk: 'low', status: 'confirmed' },
      },
    } as const
    const snapshots = { previous, current: null }
    const report = buildReport([alert()], data({ snapshots }), profile, now)
    expect(report.changes.map((c) => c.kind)).toEqual(['confirmed', 'removed'])
  })

  it('moves snapshots forward only once a week', () => {
    const first = rollSnapshots(data(), [alert()], now)
    expect(first.snapshots.current?.week).toBe('2026-10-26')
    expect(rollSnapshots(first, [], now)).toBe(first)
    const next = rollSnapshots(first, [], new Date('2026-11-03T12:00:00Z'))
    expect(next.snapshots.previous?.week).toBe('2026-10-26')
  })

  it('offers the first unfinished step on the top alert', () => {
    const top = alert({ risk: 'high' })
    const report = buildReport([top], data({ doneSteps: [stepKey(top, 'one')] }), profile, now)
    expect(report.nextAction?.action).toBe('two')
  })
})

describe('readiness', () => {
  it('counts plan steps, alarm and install', () => {
    const plan = { safePlace: '', checks: ['backup'] }
    expect(readiness(plan, true, false)).toEqual({ done: 2, total: 5 })
  })
})

describe('message checker', () => {
  it('flags wallet addresses and recovery requests as scams', () => {
    expect(checkMessage('Send to bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', [])).toBe('scam')
    expect(checkMessage('Enter your recovery words now', [])).toBe('scam')
  })

  it('recognises our alerts and nothing else', () => {
    expect(checkMessage('Alert: Title today', [alert()])).toBe('real')
    expect(checkMessage('You won a prize', [alert()])).toBe('unknown')
  })
})

describe('proof of work', () => {
  const now = new Date('2026-11-01T12:00:00Z')

  it('accepts real work and refuses other payloads', async () => {
    const nonce = await doWork('report', 'hello', now, 8)
    expect(checkWork('report', 'hello', nonce, now, 8)).toBe(true)
    expect(checkWork('report', 'changed', nonce, now, 12)).toBe(false)
  })

  it('refuses old work and junk', async () => {
    const nonce = await doWork('report', 'hello', now, 8)
    expect(checkWork('report', 'hello', nonce, new Date('2026-11-05T12:00:00Z'), 8)).toBe(false)
    expect(checkWork('report', 'hello', 'x', now, 8)).toBe(false)
  })
})

describe('reporter keys', () => {
  it('proves who signed and refuses changed words', () => {
    const key = newReporterKey()
    const signed = signPayload('hello', key)
    expect(signerOf(signed, 'hello', new Date())).toBe(publicKeyOf(key))
    expect(signerOf(signed, 'changed', new Date())).toBeNull()
  })

  it('round trips the backup key', () => {
    const key = newReporterKey()
    expect(keyFromBackup(backupKey(key))).toBe(key)
  })
})

describe('agent address safety', () => {
  it('blocks private networks', () => {
    for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '172.16.0.1', '::1', 'fd00::1', '::ffff:127.0.0.1']) {
      expect(isPrivateAddress(ip)).toBe(true)
    }
    expect(isPrivateAddress('8.8.8.8')).toBe(false)
  })

  it('only allows plain https names', () => {
    expect(isSafeHookUrl('https://agent.example/hook')).toBe(true)
    expect(isSafeHookUrl('http://agent.example/hook')).toBe(false)
    expect(isSafeHookUrl('https://127.0.0.1/hook')).toBe(false)
    expect(isSafeHookUrl('https://user:pass@agent.example/')).toBe(false)
  })
})

describe('backup safety', () => {
  it('survives junk without crashing', () => {
    expect(cleanData('junk').profile).toBeNull()
    expect(cleanData({ profile: { country: 'XX' } }).profile).toBeNull()
  })
})

describe('updated time', () => {
  const now = new Date('2026-11-02T12:00:00Z')
  it('says how long ago in short words', () => {
    expect(updatedAgo(null, now)).toBe('Not updated yet')
    expect(updatedAgo('2026-11-02T11:59:30Z', now)).toBe('Updated just now')
    expect(updatedAgo('2026-11-02T11:55:00Z', now)).toBe('Updated 5 min ago')
    expect(updatedAgo('2026-11-02T09:00:00Z', now)).toBe('Updated 3 h ago')
    expect(updatedAgo('2026-11-01T11:00:00Z', now)).toBe('Updated 1 day ago')
  })
})
