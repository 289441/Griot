// One small database connection, created on first use.
import postgres from 'postgres'

let client: postgres.Sql | null = null

export function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.')
    client = postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20 })
  }
  return client
}
