// Applies any SQL files in db/migrations that have not run yet, in order.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const envFile = fileURLToPath(new URL('../.env.local', import.meta.url))
if (existsSync(envFile)) process.loadEnvFile(envFile)

const folder = fileURLToPath(new URL('../db/migrations', import.meta.url))
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} })

await sql`create table if not exists schema_migrations (name text primary key)`
const done = new Set((await sql`select name from schema_migrations`).map((row) => row.name))

for (const name of readdirSync(folder).sort()) {
  if (done.has(name)) continue
  await sql.begin(async (tx) => {
    await tx.unsafe(readFileSync(`${folder}/${name}`, 'utf8'))
    await tx`insert into schema_migrations (name) values (${name})`
  })
  console.log(`Applied ${name}`)
}

await sql.end()
console.log('Database is up to date.')
