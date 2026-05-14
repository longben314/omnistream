import { createClient, type Client } from '@libsql/client'
import { v4 as uuidv4 } from 'uuid'

let client: Client

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:./data/omnistream.db'
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined

    client = createClient({
      url,
      authToken,
    })
  }
  return client
}

export interface PreparedResult {
  get: (...params: any[]) => Promise<any>
  all: (...params: any[]) => Promise<any[]>
  run: (...params: any[]) => Promise<{ changes: number; lastInsertRowid: bigint | null }>
}

export const db = {
  prepare(sql: string): PreparedResult {
    return {
      async get(...params: any[]): Promise<any> {
        const c = getClient()
        const args = params.length > 0 ? params : undefined
        const result = args
          ? await c.execute({ sql, args })
          : await c.execute(sql)
        return result.rows.length > 0 ? result.rows[0] : undefined
      },
      async all(...params: any[]): Promise<any[]> {
        const c = getClient()
        const args = params.length > 0 ? params : undefined
        const result = args
          ? await c.execute({ sql, args })
          : await c.execute(sql)
        return result.rows
      },
      async run(...params: any[]): Promise<{ changes: number; lastInsertRowid: bigint | null }> {
        const c = getClient()
        const args = params.length > 0 ? params : undefined
        const result = args
          ? await c.execute({ sql, args })
          : await c.execute(sql)
        return {
          changes: result.rowsAffected,
          lastInsertRowid: result.lastInsertRowid,
        }
      },
    }
  },

  async exec(sql: string): Promise<void> {
    const c = getClient()
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    for (const stmt of statements) {
      await c.execute(stmt)
    }
  },

  async batch(sqls: string[], argsList?: any[][]): Promise<void> {
    const c = getClient()
    const batchArgs = sqls.map((sql, i) => ({
      sql,
      args: argsList?.[i] || [],
    }))
    await c.batch(batchArgs)
  },
}

export { uuidv4 }

export async function initDatabase(): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS music_tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      audio_url TEXT DEFAULT '',
      download_url TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      genre TEXT DEFAULT '',
      language TEXT DEFAULT '',
      year INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      source TEXT DEFAULT 'jamendo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      original_title TEXT DEFAULT '',
      overview TEXT DEFAULT '',
      poster_url TEXT DEFAULT '',
      backdrop_url TEXT DEFAULT '',
      rating REAL DEFAULT 0,
      release_date TEXT DEFAULT '',
      genres TEXT DEFAULT '',
      language TEXT DEFAULT '',
      region TEXT DEFAULT '',
      runtime INTEGER DEFAULT 0,
      cast TEXT DEFAULT '',
      director TEXT DEFAULT '',
      source TEXT DEFAULT 'tmdb',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS download_links (
      id TEXT PRIMARY KEY,
      movie_id TEXT NOT NULL,
      quality TEXT NOT NULL,
      url TEXT NOT NULL,
      size TEXT DEFAULT '',
      FOREIGN KEY (movie_id) REFERENCES movies(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'default',
      resource_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('music', 'movie')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS play_history (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'default',
      resource_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('music', 'movie')),
      progress INTEGER DEFAULT 0,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collect_logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('music', 'movie')),
      status TEXT NOT NULL CHECK(status IN ('running', 'success', 'failed')),
      count INTEGER DEFAULT 0,
      message TEXT DEFAULT '',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('music', 'movie', 'mixed')),
      api_type TEXT NOT NULL DEFAULT 'custom',
      config TEXT NOT NULL DEFAULT '{}',
      url TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'default',
      event_type TEXT NOT NULL CHECK(event_type IN ('play_start', 'play_complete', 'favorite', 'search', 'skip_intro', 'skip_outro')),
      resource_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('music', 'movie')),
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rankings (
      id TEXT PRIMARY KEY,
      rank_type TEXT NOT NULL CHECK(rank_type IN ('daily', 'weekly', 'trending', 'new_release')),
      resource_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('music', 'movie')),
      score REAL DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      rank_position INTEGER DEFAULT 0,
      period_start TEXT DEFAULT '',
      period_end TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'default',
      resource_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('music', 'movie')),
      score REAL DEFAULT 0,
      reason TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS source_health (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('healthy', 'degraded', 'down')),
      latency INTEGER DEFAULT 0,
      error_rate REAL DEFAULT 0,
      consecutive_failures INTEGER DEFAULT 0,
      last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skip_timestamps (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      skip_type TEXT NOT NULL CHECK(skip_type IN ('intro', 'outro')),
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      source TEXT DEFAULT 'community',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_music_genre ON music_tracks(genre);
    CREATE INDEX IF NOT EXISTS idx_music_language ON music_tracks(language);
    CREATE INDEX IF NOT EXISTS idx_music_created ON music_tracks(created_at);
    CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies(genres);
    CREATE INDEX IF NOT EXISTS idx_movies_region ON movies(region);
    CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created_at);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, resource_type);
    CREATE INDEX IF NOT EXISTS idx_history_user ON play_history(user_id, played_at);
    CREATE INDEX IF NOT EXISTS idx_events_user_type ON events(user_id, event_type);
    CREATE INDEX IF NOT EXISTS idx_events_resource ON events(resource_id, resource_type);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
    CREATE INDEX IF NOT EXISTS idx_rankings_type ON rankings(rank_type, resource_type);
    CREATE INDEX IF NOT EXISTS idx_rankings_position ON rankings(rank_type, rank_position);
    CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
    CREATE INDEX IF NOT EXISTS idx_source_health_source ON source_health(source_id);
    CREATE INDEX IF NOT EXISTS idx_skip_timestamps_resource ON skip_timestamps(resource_id, skip_type);
  `)
}
