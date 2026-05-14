import type { VercelRequest, VercelResponse } from '@vercel/node'
import app, { ensureDbInit } from '../server/app.js'
import { seedDatabase } from '../server/seed.js'
import { db } from '../server/database.js'

let seeded = false

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDbInit()

  if (!seeded) {
    try {
      const existing = await db.prepare('SELECT COUNT(*) as count FROM music_tracks').get()
      if (existing && Number(existing.count) === 0) {
        await seedDatabase()
      }
      seeded = true
    } catch {
      seeded = true
    }
  }

  return app(req, res)
}
