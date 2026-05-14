import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const genre = req.query.genre as string
    const region = req.query.region as string
    const year = req.query.year as string
    const sort = (req.query.sort as string) || 'latest'

    const offset = (page - 1) * limit

    let whereClauses: string[] = []
    let params: any[] = []

    if (genre) {
      whereClauses.push('genres LIKE ?')
      params.push(`%${genre}%`)
    }
    if (region) {
      whereClauses.push('region = ?')
      params.push(region)
    }
    if (year) {
      whereClauses.push('release_date LIKE ?')
      params.push(`${year}%`)
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    let orderBy = 'created_at DESC'
    if (sort === 'rating') orderBy = 'rating DESC'
    else if (sort === 'popular') orderBy = 'rating DESC, created_at DESC'

    const countRow = await db.prepare(`SELECT COUNT(*) as total FROM movies ${whereStr}`).get(...params) as any
    const total = countRow.total

    const movies = await db.prepare(
      `SELECT * FROM movies ${whereStr} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset)

    res.json({
      success: true,
      movies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch movies' })
  }
})

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || ''
    if (!q.trim()) {
      res.json({ success: true, movies: [], total: 0 })
      return
    }

    const keyword = `%${q.trim()}%`
    const movies = await db.prepare(
      `SELECT * FROM movies WHERE title LIKE ? OR original_title LIKE ? ORDER BY rating DESC LIMIT 50`
    ).all(keyword, keyword)

    res.json({ success: true, movies, total: movies.length })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Search failed' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await db.prepare(`SELECT * FROM movies WHERE id = ?`).get(req.params.id) as any

    if (!movie) {
      res.status(404).json({ success: false, error: 'Movie not found' })
      return
    }

    const downloadLinks = await db.prepare(
      `SELECT * FROM download_links WHERE movie_id = ?`
    ).all(req.params.id)

    res.json({ success: true, movie, downloadLinks })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch movie' })
  }
})

export default router
