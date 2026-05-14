import { db, uuidv4 } from '../database.js'

interface UserBehavior {
  userId: string
  resourceIds: string[]
  genres: string[]
}

async function getUserBehaviors(days: number): Promise<UserBehavior[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const userEvents = await db.prepare(`
    SELECT user_id, resource_id, resource_type
    FROM events
    WHERE event_type IN ('play_start', 'play_complete', 'favorite')
      AND created_at >= ?
    ORDER BY user_id, created_at
  `).all(since.toISOString()) as any[]

  const userMap = new Map<string, { resourceIds: Set<string>; genres: Set<string> }>()

  for (const evt of userEvents) {
    if (!userMap.has(evt.user_id)) {
      userMap.set(evt.user_id, { resourceIds: new Set(), genres: new Set() })
    }
    const behavior = userMap.get(evt.user_id)!
    behavior.resourceIds.add(`${evt.resource_type}:${evt.resource_id}`)

    if (evt.resource_type === 'music') {
      const track = await db.prepare('SELECT genre FROM music_tracks WHERE id = ?').get(evt.resource_id) as any
      if (track?.genre) behavior.genres.add(track.genre)
    } else {
      const movie = await db.prepare('SELECT genres FROM movies WHERE id = ?').get(evt.resource_id) as any
      if (movie?.genres) {
        movie.genres.split(',').map((g: string) => g.trim()).filter(Boolean).forEach((g: string) => behavior.genres.add(g))
      }
    }
  }

  return Array.from(userMap.entries()).map(([userId, data]) => ({
    userId,
    resourceIds: Array.from(data.resourceIds),
    genres: Array.from(data.genres),
  }))
}

function jaccardSimilarity(setA: string[], setB: string[]): number {
  const a = new Set(setA)
  const b = new Set(setB)
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return union.size === 0 ? 0 : intersection.size / union.size
}

async function itemBasedRecommend(userId: string, behaviors: UserBehavior[]): Promise<{ resourceId: string; resourceType: string; score: number; reason: string }[]> {
  const userBehavior = behaviors.find(b => b.userId === userId)
  if (!userBehavior || userBehavior.resourceIds.length === 0) return []

  const similarUsers = behaviors
    .filter(b => b.userId !== userId)
    .map(b => ({
      userId: b.userId,
      similarity: jaccardSimilarity(userBehavior.resourceIds, b.resourceIds),
      resourceIds: b.resourceIds,
    }))
    .filter(b => b.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20)

  const candidateScores = new Map<string, { score: number; reasons: string[] }>()

  for (const similarUser of similarUsers) {
    const newItems = similarUser.resourceIds.filter(id => !userBehavior.resourceIds.includes(id))
    for (const item of newItems) {
      if (!candidateScores.has(item)) {
        candidateScores.set(item, { score: 0, reasons: [] })
      }
      const candidate = candidateScores.get(item)!
      candidate.score += similarUser.similarity
      candidate.reasons.push(`与您品味相似的用户也喜欢`)
    }
  }

  const userGenres = new Set(userBehavior.genres)
  const candidates = Array.from(candidateScores.entries()).map(([key, val]) => {
    const [resourceType, resourceId] = key.split(':')
    return { resourceId, resourceType, score: val.score, reason: val.reasons[0] || '为您推荐' }
  })

  for (const candidate of candidates) {
    if (candidate.resourceType === 'music') {
      const track = await db.prepare('SELECT genre FROM music_tracks WHERE id = ?').get(candidate.resourceId) as any
      if (track?.genre && userGenres.has(track.genre)) {
        candidate.score *= 1.3
      }
    } else {
      const movie = await db.prepare('SELECT genres FROM movies WHERE id = ?').get(candidate.resourceId) as any
      if (movie?.genres) {
        const movieGenres = movie.genres.split(',').map((g: string) => g.trim())
        if (movieGenres.some((g: string) => userGenres.has(g))) {
          candidate.score *= 1.3
        }
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 30)
}

async function coldStartRecommend(): Promise<{ resourceId: string; resourceType: string; score: number; reason: string }[]> {
  const recommendations: { resourceId: string; resourceType: string; score: number; reason: string }[] = []

  const topMusic = await db.prepare(
    'SELECT id FROM music_tracks ORDER BY play_count DESC LIMIT 10'
  ).all() as any[]

  for (let i = 0; i < topMusic.length; i++) {
    recommendations.push({
      resourceId: topMusic[i].id,
      resourceType: 'music',
      score: (10 - i) * 1.0,
      reason: '热门音乐',
    })
  }

  const topMovies = await db.prepare(
    'SELECT id FROM movies ORDER BY rating DESC LIMIT 10'
  ).all() as any[]

  for (let i = 0; i < topMovies.length; i++) {
    recommendations.push({
      resourceId: topMovies[i].id,
      resourceType: 'movie',
      score: (10 - i) * 1.0,
      reason: '高分影视',
    })
  }

  return recommendations
}

export async function generateRecommendations(): Promise<{ usersProcessed: number; totalRecommendations: number }> {
  const behaviors = await getUserBehaviors(7)

  if (behaviors.length === 0) {
    const coldRecs = await coldStartRecommend()
    await db.prepare("DELETE FROM recommendations WHERE user_id = 'default'").run()
    for (const rec of coldRecs) {
      const id = uuidv4()
      await db.prepare(`
        INSERT INTO recommendations (id, user_id, resource_id, resource_type, score, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, 'default', rec.resourceId, rec.resourceType, rec.score, rec.reason, new Date().toISOString())
    }
    return { usersProcessed: 0, totalRecommendations: coldRecs.length }
  }

  let totalRecs = 0
  for (const behavior of behaviors) {
    const recs = await itemBasedRecommend(behavior.userId, behaviors)

    if (recs.length === 0) {
      const coldRecs = await coldStartRecommend()
      recs.push(...coldRecs)
    }

    await db.prepare('DELETE FROM recommendations WHERE user_id = ?').run(behavior.userId)

    for (const rec of recs) {
      const id = uuidv4()
      await db.prepare(`
        INSERT INTO recommendations (id, user_id, resource_id, resource_type, score, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, behavior.userId, rec.resourceId, rec.resourceType, rec.score, rec.reason, new Date().toISOString())
    }
    totalRecs += recs.length
  }

  return { usersProcessed: behaviors.length, totalRecommendations: totalRecs }
}
