import { Router, type Request, type Response } from 'express'
import { db, uuidv4 } from '../database.js'

const router = Router()

router.get('/favorites', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.user_id as string) || 'default'
    const resourceType = req.query.type as string

    let favorites: any[]
    if (resourceType && (resourceType === 'music' || resourceType === 'movie')) {
      favorites = await db.prepare(
        `SELECT * FROM favorites WHERE user_id = ? AND resource_type = ? ORDER BY created_at DESC`
      ).all(userId, resourceType)
    } else {
      favorites = await db.prepare(
        `SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC`
      ).all(userId)
    }

    const enrichedFavorites = await Promise.all(favorites.map(async (fav: any) => {
      let resource = null
      if (fav.resource_type === 'music') {
        resource = await db.prepare(`SELECT * FROM music_tracks WHERE id = ?`).get(fav.resource_id)
      } else if (fav.resource_type === 'movie') {
        resource = await db.prepare(`SELECT * FROM movies WHERE id = ?`).get(fav.resource_id)
      }
      return { ...fav, resource }
    }))

    res.json({ success: true, favorites: enrichedFavorites })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch favorites' })
  }
})

router.post('/favorites', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceId, resourceType, userId } = req.body

    if (!resourceId || !resourceType) {
      res.status(400).json({ success: false, error: 'resourceId and resourceType are required' })
      return
    }

    if (resourceType !== 'music' && resourceType !== 'movie') {
      res.status(400).json({ success: false, error: 'resourceType must be music or movie' })
      return
    }

    const existing = await db.prepare(
      `SELECT id FROM favorites WHERE user_id = ? AND resource_id = ? AND resource_type = ?`
    ).get(userId || 'default', resourceId, resourceType)

    if (existing) {
      res.json({ success: true, favorite: existing })
      return
    }

    const id = uuidv4()
    await db.prepare(
      `INSERT INTO favorites (id, user_id, resource_id, resource_type, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId || 'default', resourceId, resourceType, new Date().toISOString())

    res.json({ success: true, favorite: { id, user_id: userId || 'default', resource_id: resourceId, resource_type: resourceType } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to add favorite' })
  }
})

router.delete('/favorites/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.prepare(`DELETE FROM favorites WHERE id = ?`).run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Favorite not found' })
      return
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to remove favorite' })
  }
})

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.user_id as string) || 'default'

    const history = await db.prepare(
      `SELECT * FROM play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 100`
    ).all(userId)

    const enrichedHistory = await Promise.all(history.map(async (item: any) => {
      let resource = null
      if (item.resource_type === 'music') {
        resource = await db.prepare(`SELECT * FROM music_tracks WHERE id = ?`).get(item.resource_id)
      } else if (item.resource_type === 'movie') {
        resource = await db.prepare(`SELECT * FROM movies WHERE id = ?`).get(item.resource_id)
      }
      return { ...item, resource }
    }))

    res.json({ success: true, history: enrichedHistory })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch history' })
  }
})

router.post('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceId, resourceType, progress, userId } = req.body

    if (!resourceId || !resourceType) {
      res.status(400).json({ success: false, error: 'resourceId and resourceType are required' })
      return
    }

    if (resourceType !== 'music' && resourceType !== 'movie') {
      res.status(400).json({ success: false, error: 'resourceType must be music or movie' })
      return
    }

    const existing = await db.prepare(
      `SELECT id FROM play_history WHERE user_id = ? AND resource_id = ? AND resource_type = ?`
    ).get(userId || 'default', resourceId, resourceType)

    if (existing) {
      await db.prepare(
        `UPDATE play_history SET progress = ?, played_at = ? WHERE id = ?`
      ).run(progress || 0, new Date().toISOString(), (existing as any).id)
    } else {
      const id = uuidv4()
      await db.prepare(
        `INSERT INTO play_history (id, user_id, resource_id, resource_type, progress, played_at) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, userId || 'default', resourceId, resourceType, progress || 0, new Date().toISOString())
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to add history' })
  }
})

export default router
