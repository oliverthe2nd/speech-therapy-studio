#!/usr/bin/env node
import pg from 'pg'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(path.join(root, '.env'), 'utf8')
const match = env.match(/^DATABASE_URL="(.+)"/m)

if (!match) {
  console.error('DATABASE_URL not found in .env')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: match[1].replace('sslmode=require', 'sslmode=verify-full'),
  ssl: { rejectUnauthorized: true },
})

await client.connect()

const tables = [
  'sessions',
  'executive_dossier',
  'personalized_drill_cache',
  'speech_analytics',
]

console.log('Row counts:')
for (const table of tables) {
  const { rows } = await client.query(
    `select count(*)::int as n from public.${table}`,
  )
  console.log(`  public.${table}: ${rows[0].n}`)
}

try {
  const { rows } = await client.query(
    'select count(*)::int as n from neon_auth.user',
  )
  console.log(`  neon_auth.user: ${rows[0].n}`)
} catch {
  console.log('  neon_auth.user: (not found — enable Neon Auth first)')
}

await client.end()
