// Sends reports and creates reporter names from the device.
import { signPayload } from './reporter.ts'
import { AGENT_BITS, doWork, REPORT_BITS } from './work.ts'

const post = (url: string, body: object) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

export async function sendReport(body: string, links: string[], reporterKey: string | null) {
  const payload = JSON.stringify({ body, links })
  const nonce = await doWork('report', payload, new Date(), REPORT_BITS)
  const signed = reporterKey ? signPayload(payload, reporterKey) : undefined
  const response = await post('/api/reports', { body, links, nonce, signed })
  if (!response.ok) throw new Error('Could not send. Try again.')
  return (await response.json()).receipt as string
}

export async function reportStatus(code: string) {
  const response = await post('/api/reports/status', { code })
  return response.ok ? ((await response.json()) as { status: string; reason: string | null }) : null
}

export async function claimName(name: string, reporterKey: string, proof = '') {
  const payload = JSON.stringify({ name, proof_url: proof })
  const nonce = await doWork('reporter', payload, new Date(), REPORT_BITS)
  const signed = signPayload(payload, reporterKey)
  const response = await post('/api/reporters', { name, proof_url: proof, signed, nonce })
  if (response.status === 409) throw new Error('That name is taken.')
  if (!response.ok) throw new Error('Could not save. Try again.')
}

export async function connectAgent(url: string | null, country: string, holdings: string[]) {
  const payload = JSON.stringify({ url, country, holdings })
  const nonce = await doWork('agent', payload, new Date(), AGENT_BITS)
  const response = await post('/api/agents', { url, country, holdings, nonce })
  if (!response.ok) throw new Error('Could not connect. Use an https address.')
  return (await response.json()).token as string
}

export async function disconnectAgent(token: string) {
  await fetch('/api/agents', { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
}
