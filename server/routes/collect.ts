import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'
import { collectMusic, collectMovies } from '../services/collector.js'

const router = Router()

router.post('/music', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await collectMusic()
    res.json({ success: true, ...result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Music collection failed' })
  }
})

router.post('/movies', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await collectMovies()
    res.json({ success: true, ...result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Movie collection failed' })
  }
})

router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const musicLog = await db.prepare(
      `SELECT * FROM collect_logs WHERE type = 'music' ORDER BY started_at DESC LIMIT 5`
    ).all()

    const movieLog = await db.prepare(
      `SELECT * FROM collect_logs WHERE type = 'movie' ORDER BY started_at DESC LIMIT 5`
    ).all()

    res.json({ success: true, music: musicLog, movies: movieLog })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch status' })
  }
})

export default router
