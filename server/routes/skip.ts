import { Router, type Request, type Response } from 'express'
import { db, uuidv4 } from '../database.js'

const router = Router()

router.get('/:resourceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params
    const skipType = req.query.type as string

    let timestamps: any[]
    if (skipType && ['intro', 'outro'].includes(skipType)) {
      timestamps = await db.prepare(`
        SELECT * FROM skip_timestamps
        WHERE resource_id = ? AND skip_type = ?
        ORDER BY (upvotes - downvotes) DESC
        LIMIT 1
      `).all(resourceId, skipType)
    } else {
      timestamps = await db.prepare(`
        SELECT * FROM skip_timestamps
        WHERE resource_id = ?
        ORDER BY (upvotes - downvotes) DESC
      `).all(resourceId)
    }

    res.json({ success: true, timestamps })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch skip timestamps' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceId, skipType, startTime, endTime, source } = req.body

    if (!resourceId || !skipType || startTime === undefined || endTime === undefined) {
      res.status(400).json({ success: false, error: 'resourceId, skipType, startTime and endTime are required' })
      return
    }

    if (!['intro', 'outro'].includes(skipType)) {
      res.status(400).json({ success: false, error: 'skipType must be intro or outro' })
      return
    }

    const id = uuidv4()
    await db.prepare(`
      INSERT INTO skip_timestamps (id, resource_id, skip_type, start_time, end_time, upvotes, downvotes, source, created_at)
      VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)
    `).run(
      id,
      resourceId,
      skipType,
      startTime,
      endTime,
      source || 'community',
      new Date().toISOString()
    )

    res.json({ success: true, timestamp: { id, resourceId, skipType, startTime, endTime } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create skip timestamp' })
  }
})

router.post('/:id/vote', async (req: Request, res: Response): Promise<void> => {
  try {
    const { direction } = req.body
    if (!['up', 'down'].includes(direction)) {
      res.status(400).json({ success: false, error: 'direction must be up or down' })
      return
    }

    const field = direction === 'up' ? 'upvotes' : 'downvotes'
    const result = await db.prepare(
      `UPDATE skip_timestamps SET ${field} = ${field} + 1 WHERE id = ?`
    ).run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Timestamp not found' })
      return
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to vote' })
  }
})

export default router
