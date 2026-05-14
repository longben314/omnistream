import { db, uuidv4 } from '../database.js'

const FETCH_TIMEOUT = 8000
const MAX_CONSECUTIVE_FAILURES = 3

async function testSource(source: any): Promise<{
  sourceId: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  error: string
}> {
  const sourceId = source.id
  const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config
  const testUrl = source.url || config.testUrl || config.baseUrl

  if (!testUrl) {
    return { sourceId, status: 'down', latency: 0, error: 'No URL configured' }
  }

  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'OmniStream/1.0 HealthCheck' },
    })
    clearTimeout(timeout)
    const latency = Date.now() - start

    if (response.ok) {
      return { sourceId, status: latency < 3000 ? 'healthy' : 'degraded', latency, error: '' }
    } else {
      return { sourceId, status: 'down', latency, error: `HTTP ${response.status}` }
    }
  } catch (err: any) {
    clearTimeout(timeout)
    const latency = Date.now() - start
    return { sourceId, status: 'down', latency, error: err.name === 'AbortError' ? 'Timeout' : err.message }
  }
}

export async function runHealthCheck(): Promise<{
  total: number
  healthy: number
  degraded: number
  down: number
  details: any[]
}> {
  const sources = await db.prepare(
    'SELECT * FROM sources WHERE enabled = 1'
  ).all() as any[]

  const results = await Promise.all(sources.map(s => testSource(s)))

  let healthy = 0
  let degraded = 0
  let down = 0

  for (const result of results) {
    const id = uuidv4()
    await db.prepare(`
      INSERT INTO source_health (id, source_id, status, latency, consecutive_failures, last_checked, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(id, result.sourceId, result.status, result.latency, new Date().toISOString(), new Date().toISOString())

    if (result.status === 'healthy') {
      healthy++
    } else if (result.status === 'degraded') {
      degraded++
    } else {
      down++

      const lastHealth = await db.prepare(
        `SELECT consecutive_failures FROM source_health WHERE source_id = ? ORDER BY created_at DESC LIMIT 1 OFFSET 1`
      ).get(result.sourceId) as any

      const prevFailures = lastHealth?.consecutive_failures || 0
      const newFailures = prevFailures + 1

      await db.prepare(
        'UPDATE source_health SET consecutive_failures = ? WHERE id = ?'
      ).run(newFailures, id)

      if (newFailures >= MAX_CONSECUTIVE_FAILURES) {
        await db.prepare(
          'UPDATE sources SET enabled = 0, updated_at = ? WHERE id = ?'
        ).run(new Date().toISOString(), result.sourceId)
        console.warn(`[HealthCheck] Source ${result.sourceId} disabled after ${newFailures} consecutive failures`)
      } else {
        await db.prepare(
          'UPDATE sources SET sort_order = sort_order + 100, updated_at = ? WHERE id = ?'
        ).run(new Date().toISOString(), result.sourceId)
      }
    }

    if (result.status === 'healthy') {
      await db.prepare(
        'UPDATE sources SET sort_order = GREATEST(sort_order - 50, 0), updated_at = ? WHERE id = ?'
      ).run(new Date().toISOString(), result.sourceId)
    }
  }

  return {
    total: sources.length,
    healthy,
    degraded,
    down,
    details: results,
  }
}

export async function autoDiscoverSources(): Promise<{ discovered: number; added: number }> {
  const NAV_SITES = [
    'https://raw.githubusercontent.com/senshinya/moontv/main/config.json',
  ]

  let discovered = 0
  let added = 0

  for (const siteUrl of NAV_SITES) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch(siteUrl, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) continue

      const data = await response.json()
      const sourceList = data.sources || data.apiList || []

      for (const src of sourceList) {
        discovered++
        const existingUrl = src.url || src.api || ''
        if (!existingUrl) continue

        const exists = await db.prepare(
          'SELECT id FROM sources WHERE url = ?'
        ).get(existingUrl)

        if (!exists) {
          const id = uuidv4()
          await db.prepare(`
            INSERT INTO sources (id, name, type, api_type, config, url, enabled, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
          `).run(
            id,
            src.name || `Auto-discovered ${discovered}`,
            src.type || 'movie',
            src.apiType || src.api_type || 'custom',
            typeof src.config === 'object' ? JSON.stringify(src.config) : (src.config || '{}'),
            existingUrl,
            new Date().toISOString(),
            new Date().toISOString()
          )
          added++
        }
      }
    } catch (err: any) {
      console.warn(`[AutoDiscover] Error fetching ${siteUrl}: ${err.message}`)
    }
  }

  return { discovered, added }
}
