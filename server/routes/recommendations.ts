import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.user_id as string) || 'default'

    const recs = await db.prepare(`
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
        END as subtitle,
        CASE 
          WHEN r.resource_type = 'music' THEN m.genre
          WHEN r.resource_type = 'movie' THEN mv.genres
        END as genre_info
      FROM recommendations r
      LEFT JOIN music_tracks m ON r.resource_type = 'music' AND r.resource_id = m.id
      LEFT JOIN movies mv ON r.resource_type = 'movie' AND r.resource_id = mv.id
      WHERE r.user_id = ?
      ORDER BY r.score DESC
      LIMIT 30
    `).all(userId)

    if (recs.length === 0) {
      const topMusic = await db.prepare(
        'SELECT id, title, cover_url, artist, genre as genre_info, play_count FROM music_tracks ORDER BY play_count DESC LIMIT 5'
      ).all()

      const topMovies = await db.prepare(
        'SELECT id, title, poster_url, rating as subtitle, genres as genre_info, rating FROM movies ORDER BY rating DESC LIMIT 5'
      ).all()

      const coldStart = [
        ...topMusic.map((m: any) => ({
          ...m,
          resource_id: m.id,
          resource_type: 'music',
          image_url: m.cover_url,
          score: m.play_count || 0,
          reason: '热门音乐',
        })),
        ...topMovies.map((m: any) => ({
          ...m,
          resource_id: m.id,
          resource_type: 'movie',
          image_url: m.poster_url,
          score: m.rating || 0,
          reason: '高分影视',
        })),
      ]

      res.json({ success: true, recommendations: coldStart, isColdStart: true })
      return
    }

    res.json({ success: true, recommendations: recs, isColdStart: false })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch recommendations' })
  }
})

export default router
