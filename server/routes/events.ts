import { Router, type Request, type Response } from 'express'
import { db, uuidv4 } from '../database.js'

const router = Router()

const VALID_EVENT_TYPES = ['play_start', 'play_complete', 'favorite', 'search', 'skip_intro', 'skip_outro']
const VALID_RESOURCE_TYPES = ['music', 'movie']

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, eventType, resourceId, resourceType, metadata } = req.body

    if (!eventType || !resourceId || !resourceType) {
      res.status(400).json({ success: false, error: 'eventType, resourceId and resourceType are required' })
      return
    }

    if (!VALID_EVENT_TYPES.includes(eventType)) {
      res.status(400).json({ success: false, error: `eventType must be one of: ${VALID_EVENT_TYPES.join(', ')}` })
      return
    }

    if (!VALID_RESOURCE_TYPES.includes(resourceType)) {
      res.status(400).json({ success: false, error: 'resourceType must be music or movie' })
      return
    }

    const id = uuidv4()
    await db.prepare(`
      INSERT INTO events (id, user_id, event_type, resource_id, resource_type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId || 'default',
      eventType,
      resourceId,
      resourceType,
      typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || '{}'),
      new Date().toISOString()
    )

    if (eventType === 'play_start' || eventType === 'play_complete') {
      const table = resourceType === 'music' ? 'music_tracks' : 'movies'
      await db.prepare(`UPDATE ${table} SET play_count = play_count + 1, updated_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), resourceId)
    }

    res.json({ success: true, eventId: id })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to track event' })
  }
})

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { events } = req.body

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, error: 'events array is required' })
      return
    }

    const results: string[] = []
    for (const evt of events.slice(0, 50)) {
      if (!evt.eventType || !evt.resourceId || !evt.resourceType) continue
      if (!VALID_EVENT_TYPES.includes(evt.eventType)) continue
      if (!VALID_RESOURCE_TYPES.includes(evt.resourceType)) continue

      const id = uuidv4()
      await db.prepare(`
        INSERT INTO events (id, user_id, event_type, resource_id, resource_type, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        evt.userId || 'default',
        evt.eventType,
        evt.resourceId,
        evt.resourceType,
        typeof evt.metadata === 'object' ? JSON.stringify(evt.metadata) : (evt.metadata || '{}'),
        new Date().toISOString()
      )
      results.push(id)
    }

    res.json({ success: true, eventIds: results })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to track events' })
  }
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.user_id as string) || 'default'
    const days = Math.min(30, Math.max(1, parseInt(req.query.days as string) || 7))

    const since = new Date()
    since.setDate(since.getDate() - days)

    const playCount = await db.prepare(`
      SELECT COUNT(*) as count FROM events
      WHERE user_id = ? AND event_type IN ('play_start', 'play_complete') AND created_at >= ?
    `).get(userId, since.toISOString()) as any

    const favoriteCount = await db.prepare(`
      SELECT COUNT(*) as count FROM events
      WHERE user_id = ? AND event_type = 'favorite' AND created_at >= ?
    `).get(userId, since.toISOString()) as any

    const searchCount = await db.prepare(`
      SELECT COUNT(*) as count FROM events
      WHERE user_id = ? AND event_type = 'search' AND created_at >= ?
    `).get(userId, since.toISOString()) as any

    const topGenres = await db.prepare(`
      SELECT
        CASE
          WHEN e.resource_type = 'music' THEN m.genre
          WHEN e.resource_type = 'movie' THEN SUBSTR(m.genres, 1, INSTR(m.genres || ',', ',') - 1)
        END as genre,
        COUNT(*) as count
      FROM events e
      LEFT JOIN music_tracks m ON e.resource_type = 'music' AND e.resource_id = m.id
      LEFT JOIN movies mv ON e.resource_type = 'movie' AND e.resource_id = mv.id
      WHERE e.user_id = ? AND e.event_type IN ('play_start', 'play_complete') AND e.created_at >= ?
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 5
    `).all(userId, since.toISOString())

    res.json({
      success: true,
      stats: {
        playCount: playCount?.count || 0,
        favoriteCount: favoriteCount?.count || 0,
        searchCount: searchCount?.count || 0,
        topGenres,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch stats' })
  }
})

export default router
