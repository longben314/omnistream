import { db, uuidv4 } from '../database.js'

type RankType = 'daily' | 'weekly' | 'trending' | 'new_release'

function getPeriodDates(type: RankType): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString()

  switch (type) {
    case 'daily': {
      const start = new Date(now)
      start.setDate(start.getDate() - 1)
      return { start: start.toISOString(), end }
    }
    case 'weekly': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return { start: start.toISOString(), end }
    }
    case 'trending': {
      const start = new Date(now)
      start.setDate(start.getDate() - 3)
      return { start: start.toISOString(), end }
    }
    case 'new_release': {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return { start: start.toISOString(), end }
    }
  }
}

async function calculateRankings(type: RankType, resourceType: 'music' | 'movie'): Promise<number> {
  const { start, end } = getPeriodDates(type)

  let playEvents: any[]
  if (resourceType === 'music') {
    playEvents = await db.prepare(`
      SELECT resource_id, COUNT(*) as play_count
      FROM events
      WHERE event_type IN ('play_start', 'play_complete')
        AND resource_type = 'music'
        AND created_at >= ? AND created_at <= ?
      GROUP BY resource_id
      ORDER BY play_count DESC
      LIMIT 50
    `).all(start, end) as any[]
  } else {
    playEvents = await db.prepare(`
      SELECT resource_id, COUNT(*) as play_count
      FROM events
      WHERE event_type IN ('play_start', 'play_complete')
        AND resource_type = 'movie'
        AND created_at >= ? AND created_at <= ?
      GROUP BY resource_id
      ORDER BY play_count DESC
      LIMIT 50
    `).all(start, end) as any[]
  }

  let items: { resourceId: string; score: number; playCount: number }[] = []

  if (type === 'new_release') {
    const table = resourceType === 'music' ? 'music_tracks' : 'movies'
    const dateField = 'created_at'
    const newItems = await db.prepare(`
      SELECT id, play_count FROM ${table}
      WHERE ${dateField} >= ?
      ORDER BY play_count DESC, ${dateField} DESC
      LIMIT 50
    `).all(start) as any[]

    items = newItems.map((item, idx) => ({
      resourceId: item.id,
      score: (newItems.length - idx) * 1.5 + (item.play_count || 0) * 0.1,
      playCount: item.play_count || 0,
    }))
  } else {
    const favoriteBoost = await db.prepare(`
      SELECT resource_id, COUNT(*) as fav_count
      FROM events
      WHERE event_type = 'favorite'
        AND resource_type = ?
        AND created_at >= ? AND created_at <= ?
      GROUP BY resource_id
    `).all(resourceType, start, end) as any[]

    const favMap = new Map(favoriteBoost.map(f => [f.resource_id, f.fav_count]))

    items = playEvents.map((evt, idx) => {
      const favCount = favMap.get(evt.resource_id) || 0
      let score = (playEvents.length - idx) * 1.0
      score += evt.play_count * 0.5
      score += favCount * 3.0

      if (type === 'trending') {
        score *= 1.5
      }

      return {
        resourceId: evt.resource_id,
        score: Math.round(score * 100) / 100,
        playCount: evt.play_count,
      }
    })

    items.sort((a, b) => b.score - a.score)
  }

  await db.prepare(`
    DELETE FROM rankings WHERE rank_type = ? AND resource_type = ? AND period_start = ? AND period_end = ?
  `).run(type, resourceType, start, end)

  let inserted = 0
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const id = uuidv4()
    await db.prepare(`
      INSERT INTO rankings (id, rank_type, resource_id, resource_type, score, play_count, rank_position, period_start, period_end, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      type,
      item.resourceId,
      resourceType,
      item.score,
      item.playCount,
      i + 1,
      start,
      end,
      new Date().toISOString()
    )
    inserted++
  }

  return inserted
}

export async function generateAllRankings(): Promise<{ [key: string]: number }> {
  const results: { [key: string]: number } = {}

  for (const type of ['daily', 'weekly', 'trending', 'new_release'] as RankType[]) {
    for (const resourceType of ['music', 'movie'] as const) {
      const key = `${type}_${resourceType}`
      try {
        results[key] = await calculateRankings(type, resourceType)
      } catch (err: any) {
        console.error(`[Rankings] Error calculating ${key}: ${err.message}`)
        results[key] = 0
      }
    }
  }

  return results
}
