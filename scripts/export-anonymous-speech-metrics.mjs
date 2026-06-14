#!/usr/bin/env node
/**
 * Export de-identified B2B research metrics from public.anonymous_speech_metrics.
 *
 * Requires DATABASE_URL (Neon Postgres connection string).
 *
 * Usage:
 *   npm run export:research-metrics
 *   npm run export:research-metrics -- --out exports/metrics.json
 *   npm run export:research-metrics -- --limit 500 --since 2026-01-01
 */

import pg from 'pg'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const { Client } = pg
const VIEW = 'anonymous_speech_metrics'

function parseArgs(argv) {
  const options = {
    out: null,
    limit: null,
    since: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--out' && argv[index + 1]) {
      options.out = argv[++index]
      continue
    }
    if (token === '--limit' && argv[index + 1]) {
      options.limit = Number.parseInt(argv[++index], 10)
      continue
    }
    if (token === '--since' && argv[index + 1]) {
      options.since = argv[++index]
    }
  }

  return options
}

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('Missing DATABASE_URL in environment.')
    process.exit(1)
  }

  return databaseUrl
}

async function fetchAllRows(client, { limit, since }) {
  const params = []
  let sql = `select * from public.${VIEW}`

  if (since) {
    params.push(since)
    sql += ` where recorded_at >= $${params.length}`
  }

  sql += ' order by recorded_at asc'

  if (typeof limit === 'number' && Number.isFinite(limit)) {
    params.push(limit)
    sql += ` limit $${params.length}`
  }

  const { rows } = await client.query(sql, params)
  return rows
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const databaseUrl = resolveDatabaseUrl()

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    const rows = await fetchAllRows(client, options)

    const payload = {
      exported_at: new Date().toISOString(),
      source: VIEW,
      row_count: rows.length,
      rows,
    }

    const json = `${JSON.stringify(payload, null, 2)}\n`

    if (options.out) {
      const outPath = path.resolve(options.out)
      await mkdir(path.dirname(outPath), { recursive: true })
      await writeFile(outPath, json, 'utf8')
      console.log(`Wrote ${rows.length} rows to ${outPath}`)
      return
    }

    process.stdout.write(json)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
