import { timingSafeEqual } from 'node:crypto'

// Compares in constant time so the secret can't be guessed from response speed.
export function hasCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
