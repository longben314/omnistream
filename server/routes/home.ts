import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const featuredMovies = await db.prepare(
      `SELECT * FROM movies WHERE backdrop_url != '' ORDER BY rating DESC LIMIT 5`
    ).all()

    const featuredMusic = await db.prepare(
      `SELECT * FROM music_tracks WHERE cover_url != '' ORDER BY play_count DESC LIMIT 5`
    ).all()

    const featured = [...featuredMovies, ...featuredMusic]

    const hotMusic = await db.prepare(
      `SELECT * FROM music_tracks ORDER BY play_count DESC LIMIT 10`
    ).all()

    const hotMovies = await db.prepare(
      `SELECT * FROM movies ORDER BY rating DESC LIMIT 10`
    ).all()

    const latestMusic = await db.prepare(
      `SELECT * FROM music_tracks ORDER BY created_at DESC LIMIT 10`
    ).all()

    const latestMovies = await db.prepare(
      `SELECT * FROM movies ORDER BY created_at DESC LIMIT 10`
    ).all()

    res.json({
      success: true,
      featured,
      hotMusic,
      hotMovies,
      latestMusic,
      latestMovies,
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch home data' })
  }
})

export default router
