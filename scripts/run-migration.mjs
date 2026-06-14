#!/usr/bin/env node
import pg from 'pg'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
const sqlPath = path.join(root, 'migration.sql')

const env = readFileSync(envPath, 'utf8')
const match = env.match(/^DATABASE_URL="(.+)"/m)

if (!match) {
  console.error('DATABASE_URL not found in .env')
  process.exit(1)
}

const connectionString = match[1].replace(
  'sslmode=require',
  'sslmode=verify-full',
)
const sql = readFileSync(sqlPath, 'utf8')
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: true },
})

try {
  await client.connect()
  console.log('Connected to Neon. Running migration.sql...')
  await client.query(sql)
  console.log('Migration completed successfully.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await client.end()
}
