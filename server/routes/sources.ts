import { Router, type Request, type Response } from 'express'
import { db, uuidv4 } from '../database.js'

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sources = await db.prepare(
      `SELECT * FROM sources ORDER BY sort_order ASC, created_at DESC`
    ).all()

    res.json({ success: true, sources })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch sources' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, apiType, config, url, enabled, sortOrder } = req.body

    if (!name || !type) {
      res.status(400).json({ success: false, error: 'name and type are required' })
      return
    }

    if (!['music', 'movie', 'mixed'].includes(type)) {
      res.status(400).json({ success: false, error: 'type must be music, movie or mixed' })
      return
    }

    const id = uuidv4()
    await db.prepare(`
      INSERT INTO sources (id, name, type, api_type, config, url, enabled, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      type,
      apiType || 'custom',
      typeof config === 'object' ? JSON.stringify(config) : (config || '{}'),
      url || '',
      enabled !== undefined ? (enabled ? 1 : 0) : 1,
      sortOrder || 0,
      new Date().toISOString(),
      new Date().toISOString()
    )

    res.json({ success: true, source: { id, name, type } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to add source' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, apiType, config, url, enabled, sortOrder } = req.body
    const id = req.params.id

    const existing = await db.prepare(`SELECT id FROM sources WHERE id = ?`).get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Source not found' })
      return
    }

    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (type !== undefined) { updates.push('type = ?'); params.push(type) }
    if (apiType !== undefined) { updates.push('api_type = ?'); params.push(apiType) }
    if (config !== undefined) { updates.push('config = ?'); params.push(typeof config === 'object' ? JSON.stringify(config) : config) }
    if (url !== undefined) { updates.push('url = ?'); params.push(url) }
    if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled ? 1 : 0) }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder) }

    updates.push('updated_at = ?')
    params.push(new Date().toISOString())

    if (updates.length > 1) {
      params.push(id)
      await db.prepare(`UPDATE sources SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update source' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.prepare(`DELETE FROM sources WHERE id = ?`).run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Source not found' })
      return
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete source' })
  }
})

router.post('/import', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body

    if (!url) {
      res.status(400).json({ success: false, error: 'url is required' })
      return
    }

    const response = await fetch(url)
    if (!response.ok) {
      res.status(400).json({ success: false, error: `Failed to fetch config: HTTP ${response.status}` })
      return
    }

    const config = await response.json()

    if (!config.sources || !Array.isArray(config.sources)) {
      res.status(400).json({ success: false, error: 'Invalid config format: sources array required' })
      return
    }

    let imported = 0
    for (const source of config.sources) {
      if (!source.name || !source.type) continue

      const id = uuidv4()
      await db.prepare(`
        INSERT INTO sources (id, name, type, api_type, config, url, enabled, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        source.name,
        source.type,
        source.apiType || source.api_type || 'custom',
        typeof source.config === 'object' ? JSON.stringify(source.config) : (source.config || '{}'),
        source.url || '',
        source.enabled !== false ? 1 : 0,
        source.sortOrder || source.sort_order || 0,
        new Date().toISOString(),
        new Date().toISOString()
      )
      imported++
    }

    res.json({ success: true, imported, message: `Imported ${imported} sources from config` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to import sources' })
  }
})

router.get('/export', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sources = await db.prepare(
      `SELECT * FROM sources ORDER BY sort_order ASC, created_at DESC`
    ).all()

    const exportData = {
      name: '声影汇 SoundFlix',
      version: '1.0',
      author: 'SoundFlix',
      sources: sources.map(s => ({
        name: s.name,
        type: s.type,
        apiType: s.api_type,
        config: typeof s.config === 'string' ? JSON.parse(s.config) : s.config,
        url: s.url,
        enabled: s.enabled === 1,
        sortOrder: s.sort_order,
      })),
    }

    res.json(exportData)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to export sources' })
  }
})

export default router
