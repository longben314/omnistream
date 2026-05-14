import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import musicRoutes from './routes/music.js'
import movieRoutes from './routes/movies.js'
import homeRoutes from './routes/home.js'
import userRoutes from './routes/user.js'
import collectRoutes from './routes/collect.js'
import sourceRoutes from './routes/sources.js'
import eventRoutes from './routes/events.js'
import rankingRoutes from './routes/rankings.js'
import recommendationRoutes from './routes/recommendations.js'
import skipRoutes from './routes/skip.js'
import { initDatabase } from './database.js'
import { collectMusic, collectMovies } from './services/collector.js'
import { generateAllRankings } from './services/ranking.js'
import { generateRecommendations } from './services/recommendation.js'
import { runHealthCheck, autoDiscoverSources } from './services/healthCheck.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/music', musicRoutes)
app.use('/api/movies', movieRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/user', userRoutes)
app.use('/api/collect', collectRoutes)
app.use('/api/sources', sourceRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/rankings', rankingRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/skip', skipRoutes)

app.get('/api/cron/collect', async (_req: Request, res: Response) => {
  try {
    const musicResult = await collectMusic()
    const movieResult = await collectMovies()
    res.json({ success: true, music: musicResult, movies: movieResult })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/cron/rankings', async (_req: Request, res: Response) => {
  try {
    const results = await generateAllRankings()
    res.json({ success: true, rankings: results })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/cron/recommendations', async (_req: Request, res: Response) => {
  try {
    const results = await generateRecommendations()
    res.json({ success: true, recommendations: results })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/cron/health-check', async (_req: Request, res: Response) => {
  try {
    const healthResult = await runHealthCheck()
    const enabledSources = await db.prepare('SELECT COUNT(*) as count FROM sources WHERE enabled = 1').get() as any
    if (enabledSources && Number(enabledSources.count) < 3) {
      const discoverResult = await autoDiscoverSources()
      res.json({ success: true, health: healthResult, discovery: discoverResult })
    } else {
      res.json({ success: true, health: healthResult })
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

import { db } from './database.js'

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok', version: 'OmniStream v2.0' })
})

const distPath = path.resolve(__dirname, '../dist')

app.use(express.static(distPath))

app.get('/sw.js', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'sw.js'), {
    headers: { 'Service-Worker-Allowed': '/' },
  })
})

app.get('/manifest.json', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'manifest.json'))
})

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', error.message)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

let dbInitialized = false

export async function ensureDbInit() {
  if (!dbInitialized) {
    await initDatabase()
    dbInitialized = true
  }
}

export default app
