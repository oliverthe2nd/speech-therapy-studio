import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir, hits = []) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (statSync(file).isDirectory()) walk(file, hits)
    else if (name.includes('magic') && name.endsWith('.mjs')) hits.push(file)
  }
  return hits
}

const root = 'node_modules/better-auth/dist/client/plugins'
try {
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8')
    const match = text.match(/path:\s*["'`][^"'`]+["'`]/)
    console.log(file, match?.[0])
  }
} catch (error) {
  console.error(error.message)
}
