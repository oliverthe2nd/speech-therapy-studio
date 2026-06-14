#!/usr/bin/env node
/**
 * Copy app data from Supabase (public schema) into Neon Postgres.
 *
 * Env (in .env):
 *   DATABASE_URL
 *   SUPABASE_URL          e.g. https://YOUR_REF.supabase.co
 *   SUPABASE_ANON_KEY     or SUPABASE_SERVICE_ROLE_KEY (preferred for full export)
 *
 * Usage:
 *   npm run migrate:supabase-data
 */

import pg from 'pg'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile() {
  const envPath = path.join(root, '.env')
  const values = {}

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }

  return values
}

const env = { ...process.env, ...loadEnvFile() }

const DATABASE_URL = env.DATABASE_URL
const SUPABASE_URL =
  env.SUPABASE_URL ??
  env.VITE_SUPABASE_URL ??
  'https://pijbedgxtdycloyexjpy.supabase.co'
const SUPABASE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY ??
  env.SUPABASE_ANON_KEY ??
  env.VITE_SUPABASE_ANON_KEY

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env')
  process.exit(1)
}

if (!SUPABASE_KEY) {
  console.error(
    'Missing Supabase key. Add SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY to .env',
  )
  process.exit(1)
}

const TABLES = [
  'sessions',
  'executive_dossier',
  'personalized_drill_cache',
  'speech_analytics',
]

async function fetchSupabaseTable(table) {
  const rows = []
  const pageSize = 500
  let offset = 0
  const orderColumn = table === 'speech_analytics' ? 'recorded_at' : 'created_at'

  while (true) {
    const url = new URL(`/rest/v1/${table}`, SUPABASE_URL)
    url.searchParams.set('select', '*')
    url.searchParams.set('order', `${orderColumn}.asc`)

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    })

    if (!response.ok) {
      const detail = await response.text()

      if (response.status === 404 || /does not exist/i.test(detail)) {
        console.warn(`  Skipping ${table} — not found in Supabase`)
        return []
      }

      throw new Error(`Supabase ${table} fetch failed (${response.status}): ${detail.slice(0, 300)}`)
    }

    const page = await response.json()
    if (!Array.isArray(page) || page.length === 0) break

    rows.push(...page)
    if (page.length < pageSize) break
    offset += pageSize
  }

  return rows
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`
}

const JSONB_COLUMNS = new Set([
  'sentences',
  'focus_areas',
  'strengths',
  'blindspots',
  'growth_phases',
  'executive_metrics',
  'clinical_metrics',
  'professional_metrics',
  'phonetic_events',
])

function normalizeValue(column, value) {
  if (value === null || value === undefined) return null

  if (JSONB_COLUMNS.has(column)) {
    if (typeof value === 'string') {
      try {
        JSON.parse(value)
        return value
      } catch {
        return JSON.stringify(value)
      }
    }
    return JSON.stringify(value)
  }

  return value
}

async function upsertRows(client, table, rows) {
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (nothing to copy)`)
    return 0
  }

  const columns = Object.keys(rows[0])
  const columnList = columns.map(quoteIdent).join(', ')
  const conflictTarget =
    table === 'executive_dossier'
      ? 'client_key'
      : table === 'personalized_drill_cache'
        ? 'baseline_session_id'
        : 'id'

  let inserted = 0

  for (const row of rows) {
    const values = columns.map((column) => normalizeValue(column, row[column]))
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
    const updates = columns
      .filter((column) => column !== conflictTarget && column !== 'id')
      .map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`)
      .join(', ')

    const sql = `
      insert into public.${quoteIdent(table)} (${columnList})
      values (${placeholders})
      on conflict (${quoteIdent(conflictTarget)}) do update set ${updates}
    `

    try {
      await client.query(sql, values)
      inserted += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`${table} row ${inserted + 1}: ${message}`)
    }
  }

  console.log(`  ${table}: ${inserted} row(s) copied`)
  return inserted
}

async function main() {
  console.log(`Source: ${SUPABASE_URL}`)
  console.log('Fetching from Supabase…')

  const data = {}
  for (const table of TABLES) {
    data[table] = await fetchSupabaseTable(table)
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full'),
    ssl: { rejectUnauthorized: true },
  })

  await client.connect()
  console.log('Writing to Neon…')

  try {
    await client.query('begin')

    // FK order: sessions before personalized_drill_cache
    let total = 0
    total += await upsertRows(client, 'sessions', data.sessions)
    total += await upsertRows(client, 'executive_dossier', data.executive_dossier)
    total += await upsertRows(client, 'personalized_drill_cache', data.personalized_drill_cache)
    total += await upsertRows(client, 'speech_analytics', data.speech_analytics)

    await client.query('commit')
    console.log(`Done — ${total} total row(s) migrated.`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
