import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rankType = (req.query.type as string) || 'daily'
    const resourceType = req.query.resource_type as string

    if (!['daily', 'weekly', 'trending', 'new_release'].includes(rankType)) {
      res.status(400).json({ success: false, error: 'type must be daily, weekly, trending, or new_release' })
      return
    }

    let rankings: any[]
    if (resourceType && ['music', 'movie'].includes(resourceType)) {
      rankings = await db.prepare(`
        SELECT r.*, 
          CASE 
            WHEN r.resource_type = 'music' THEN m.title
            WHEN r.resource_type = 'movie' THEN mv.title
          END as title,
          CASE 
            WHEN r.resource_type = 'music' THEN m.cover_url
            WHEN r.resource_type = 'movie' THEN mv.poster_url
          END as image_url,
          CASE 
            WHEN r.resource_type = 'music' THEN m.artist
            WHEN r.resource_type = 'movie' THEN mv.rating
          END as subtitle
        FROM rankings r
        LEFT JOIN music_tracks m ON r.resource_type = 'music' AND r.resource_id = m.id
        LEFT JOIN movies mv ON r.resource_type = 'movie' AND r.resource_id = mv.id
        WHERE r.rank_type = ? AND r.resource_type = ?
        ORDER BY r.rank_position ASC
        LIMIT 50
      `).all(rankType, resourceType)
    } else {
      rankings = await db.prepare(`
        SELECT r.*,
          CASE 
            WHEN r.resource_type = 'music' THEN m.title
            WHEN r.resource_type = 'movie' THEN mv.title
          END as title,
          CASE 
            WHEN r.resource_type = 'music' THEN m.cover_url
            WHEN r.resource_type = 'movie' THEN mv.poster_url
          END as image_url,
          CASE 
            WHEN r.resource_type = 'music' THEN m.artist
            WHEN r.resource_type = 'movie' THEN mv.rating
          END as subtitle
        FROM rankings r
        LEFT JOIN music_tracks m ON r.resource_type = 'music' AND r.resource_id = m.id
        LEFT JOIN movies mv ON r.resource_type = 'movie' AND r.resource_id = mv.id
        WHERE r.rank_type = ?
        ORDER BY r.resource_type, r.rank_position ASC
        LIMIT 100
      `).all(rankType)
    }

    res.json({ success: true, rankings })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch rankings' })
  }
})

router.get('/summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const types = ['daily', 'weekly', 'trending', 'new_release']
    const summary: any = {}

    for (const type of types) {
      const musicRankings = await db.prepare(`
        SELECT r.resource_id, r.rank_position, r.score, r.play_count, m.title, m.cover_url, m.artist
        FROM rankings r
        JOIN music_tracks m ON r.resource_id = m.id
        WHERE r.rank_type = ? AND r.resource_type = 'music'
        ORDER BY r.rank_position ASC
        LIMIT 10
      `).all(type)

      const movieRankings = await db.prepare(`
        SELECT r.resource_id, r.rank_position, r.score, r.play_count, mv.title, mv.poster_url, mv.rating
        FROM rankings r
        JOIN movies mv ON r.resource_id = mv.id
        WHERE r.rank_type = ? AND r.resource_type = 'movie'
        ORDER BY r.rank_position ASC
        LIMIT 10
      `).all(type)

      summary[type] = { music: musicRankings, movies: movieRankings }
    }

    res.json({ success: true, summary })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch ranking summary' })
  }
})

export default router
