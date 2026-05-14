import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const genre = req.query.genre as string
    const language = req.query.language as string
    const year = req.query.year as string
    const sort = (req.query.sort as string) || 'latest'

    const offset = (page - 1) * limit

    let whereClauses: string[] = []
    let params: any[] = []

    if (genre) {
      whereClauses.push('genre = ?')
      params.push(genre)
    }
    if (language) {
      whereClauses.push('language = ?')
      params.push(language)
    }
    if (year) {
      whereClauses.push('year = ?')
      params.push(parseInt(year))
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    let orderBy = 'created_at DESC'
    if (sort === 'popular') orderBy = 'play_count DESC'
    else if (sort === 'name') orderBy = 'title ASC'

    const countRow = await db.prepare(`SELECT COUNT(*) as total FROM music_tracks ${whereStr}`).get(...params) as any
    const total = countRow.total

    const tracks = await db.prepare(
      `SELECT * FROM music_tracks ${whereStr} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset)

    res.json({
      success: true,
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch music' })
  }
})

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || ''
    if (!q.trim()) {
      res.json({ success: true, tracks: [], total: 0 })
      return
    }

    const keyword = `%${q.trim()}%`
    const tracks = await db.prepare(
      `SELECT * FROM music_tracks WHERE title LIKE ? OR artist LIKE ? ORDER BY play_count DESC LIMIT 50`
    ).all(keyword, keyword)

    res.json({ success: true, tracks, total: tracks.length })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Search failed' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const track = await db.prepare(`SELECT * FROM music_tracks WHERE id = ?`).get(req.params.id) as any

    if (!track) {
      res.status(404).json({ success: false, error: 'Track not found' })
      return
    }

    res.json({ success: true, track })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch track' })
  }
})

router.post('/:id/play', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.prepare(
      `UPDATE music_tracks SET play_count = play_count + 1, updated_at = ? WHERE id = ?`
    ).run(new Date().toISOString(), req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Track not found' })
      return
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update play count' })
  }
})

export default router
