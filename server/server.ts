import app, { ensureDbInit } from './app.js'
import { startScheduler } from './services/collector.js'
import { generateAllRankings } from './services/ranking.js'
import { generateRecommendations } from './services/recommendation.js'
import { runHealthCheck, autoDiscoverSources } from './services/healthCheck.js'
import { seedDatabase } from './seed.js'
import { db } from './database.js'
import cron from 'node-cron'

const PORT = Number(process.env.PORT) || 80

async function start() {
  await ensureDbInit()

  const existing = await db.prepare('SELECT COUNT(*) as count FROM music_tracks').get()
  if (existing && Number(existing.count) === 0) {
    await seedDatabase()
  }

  startScheduler()

  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Starting daily ranking generation...')
    try {
      const results = await generateAllRankings()
      console.log('[Scheduler] Rankings generated:', JSON.stringify(results))
    } catch (err: any) {
      console.error('[Scheduler] Ranking error:', err.message)
    }
  })

  cron.schedule('0 4 * * 1', async () => {
    console.log('[Scheduler] Starting weekly recommendation generation...')
    try {
      const results = await generateRecommendations()
      console.log('[Scheduler] Recommendations generated:', JSON.stringify(results))
    } catch (err: any) {
      console.error('[Scheduler] Recommendation error:', err.message)
    }
  })

  cron.schedule('0 */4 * * *', async () => {
    console.log('[Scheduler] Starting health check...')
    try {
      const healthResult = await runHealthCheck()
      console.log(`[Scheduler] Health check: ${healthResult.healthy} healthy, ${healthResult.degraded} degraded, ${healthResult.down} down`)

      const enabledSources = await db.prepare('SELECT COUNT(*) as count FROM sources WHERE enabled = 1').get() as any
      if (enabledSources && Number(enabledSources.count) < 3) {
        const discoverResult = await autoDiscoverSources()
        console.log(`[Scheduler] Auto-discovered: ${discoverResult.discovered} found, ${discoverResult.added} added`)
      }
    } catch (err: any) {
      console.error('[Scheduler] Health check error:', err.message)
    }
  })

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`)
    console.log(`  OmniStream 智能影视音乐聚合站`)
    console.log(`  本地访问: http://localhost:${PORT}`)
    console.log(`  局域网访问: http://<本机IP>:${PORT}`)
    console.log(`========================================`)
  })

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT signal received')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}

start()
