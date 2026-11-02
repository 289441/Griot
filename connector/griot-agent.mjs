#!/usr/bin/env node
// Lets an agent with no web address hear alerts. It runs beside the agent and prints each message.
// Usage: GRIOT_TOKEN=... GRIOT_URL=https://your-app node griot-agent.mjs [command to run]
import { spawn } from 'node:child_process'

const { GRIOT_TOKEN: token, GRIOT_URL: base } = process.env
const [command, ...args] = process.argv.slice(2)
const CHECK_EVERY_MS = 60_000

if (!token || !base) {
  console.error('Set GRIOT_TOKEN and GRIOT_URL.')
  process.exit(1)
}

// The message goes to your command as data on stdin, never as command words.
function handle(message) {
  if (!command) return console.log(JSON.stringify(message))
  const child = spawn(command, args, { stdio: ['pipe', 'inherit', 'inherit'] })
  child.on('error', (error) => console.error(error.message))
  child.stdin.end(JSON.stringify(message))
}

async function check() {
  try {
    const response = await fetch(`${base}/api/agents/inbox`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (!response.ok) return console.error(`Inbox said ${response.status}`)
    const { messages } = await response.json()
    messages.forEach(handle)
  } catch (error) {
    console.error(error.message)
  }
}

await check()
setInterval(check, CHECK_EVERY_MS)
