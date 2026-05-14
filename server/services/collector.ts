import { db, uuidv4 } from '../database.js'
import cron from 'node-cron'

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original'

const MUSIC_GENRES = ['rock', 'pop', 'jazz', 'electronic', 'hiphop', 'classical', 'metal', 'folk', 'lounge', 'reggae']

const FETCH_TIMEOUT = 10000

const JAMENDO_FALLBACK_CLIENT_ID = 'b9e8f6d3'
const TMDB_FALLBACK_API_KEY = '2dca580c2a14b55200e784d157207b4d'

async function fetchJSON(url: string): Promise<any> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function createCollectLog(type: 'music' | 'movie', status: 'running' | 'success' | 'failed', count: number, message: string, startedAt: string, finishedAt?: string) {
  const id = uuidv4()
  await db.prepare(`
    INSERT INTO collect_logs (id, type, status, count, message, started_at, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, status, count, message, startedAt, finishedAt || null)
  return id
}

async function getEnabledSources(type: 'music' | 'movie' | 'mixed'): Promise<any[]> {
  const types = type === 'mixed' ? ['music', 'movie', 'mixed'] : [type, 'mixed']
  const placeholders = types.map(() => '?').join(',')
  return db.prepare(
    `SELECT * FROM sources WHERE type IN (${placeholders}) AND enabled = 1 ORDER BY sort_order ASC`
  ).all(...types)
}

function getJamendoClientId(): string {
  return process.env.JAMENDO_CLIENT_ID || JAMENDO_FALLBACK_CLIENT_ID
}

function getTmdbApiKey(): string {
  return process.env.TMDB_API_KEY || TMDB_FALLBACK_API_KEY
}

export async function collectMusic(): Promise<{ count: number; message: string }> {
  const startedAt = new Date().toISOString()
  let logId = await createCollectLog('music', 'running', 0, 'Started music collection', startedAt)

  try {
    let totalInserted = 0

    const sources = await getEnabledSources('music')

    if (sources.length === 0) {
      const clientId = getJamendoClientId()
      const usingFallback = !process.env.JAMENDO_CLIENT_ID

      for (const genre of MUSIC_GENRES) {
        try {
          const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=50&order=popularity&tags=${genre}`
          const data = await fetchJSON(url)

          if (data.error) {
            console.warn(`[Collector] Jamendo API error for genre "${genre}": ${data.error}. Client ID: ${usingFallback ? 'fallback' : 'env'}. Skipping.`)
            continue
          }

          if (!data.results || data.results.length === 0) continue

          for (const track of data.results) {
            const id = uuidv4()
            const result = await db.prepare(`
              INSERT OR IGNORE INTO music_tracks (id, title, artist, album, cover_url, audio_url, download_url, duration, genre, language, year, play_count, source, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              id,
              track.name || 'Unknown',
              track.artist_name || 'Unknown',
              track.album_name || '',
              track.album_image || '',
              track.audio || '',
              track.audiodownload || '',
              track.duration || 0,
              genre,
              track.language || '',
              track.releasedate ? parseInt(track.releasedate.substring(0, 4)) || 0 : 0,
              0,
              'jamendo',
              new Date().toISOString(),
              new Date().toISOString()
            )
            totalInserted += result.changes
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.warn(`[Collector] Jamendo request timed out for genre "${genre}". Skipping.`)
          } else {
            console.warn(`[Collector] Error collecting genre "${genre}": ${err.message}. Skipping.`)
          }
        }
      }
    } else {
      for (const source of sources) {
        try {
          const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config

          if (source.api_type === 'jamendo' || config.api === 'jamendo') {
            const clientId = config.clientId || getJamendoClientId()
            const usingFallback = !config.clientId && !process.env.JAMENDO_CLIENT_ID
            const genres = config.genres || MUSIC_GENRES

            for (const genre of genres) {
              try {
                const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=50&order=popularity&tags=${genre}`
                const data = await fetchJSON(url)

                if (data.error) {
                  console.warn(`[Collector] Jamendo API error for genre "${genre}" from source "${source.name}": ${data.error}. Client ID: ${usingFallback ? 'fallback' : 'env'}. Skipping.`)
                  continue
                }

                if (!data.results || data.results.length === 0) continue

                for (const track of data.results) {
                  const id = uuidv4()
                  const result = await db.prepare(`
                    INSERT OR IGNORE INTO music_tracks (id, title, artist, album, cover_url, audio_url, download_url, duration, genre, language, year, play_count, source, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).run(
                    id,
                    track.name || 'Unknown',
                    track.artist_name || 'Unknown',
                    track.album_name || '',
                    track.album_image || '',
                    track.audio || '',
                    track.audiodownload || '',
                    track.duration || 0,
                    genre,
                    track.language || '',
                    track.releasedate ? parseInt(track.releasedate.substring(0, 4)) || 0 : 0,
                    0,
                    source.name,
                    new Date().toISOString(),
                    new Date().toISOString()
                  )
                  totalInserted += result.changes
                }
              } catch (err: any) {
                if (err.name === 'AbortError') {
                  console.warn(`[Collector] Jamendo request timed out for genre "${genre}" from source "${source.name}". Skipping.`)
                } else {
                  console.warn(`[Collector] Error collecting genre "${genre}" from source "${source.name}": ${err.message}. Skipping.`)
                }
              }
            }
          } else if (source.url) {
            try {
              const data = await fetchJSON(source.url)
              const tracks = config.resultsKey ? data[config.resultsKey] : (data.results || data.data || [])

              for (const track of tracks) {
                const id = uuidv4()
                const result = await db.prepare(`
                  INSERT OR IGNORE INTO music_tracks (id, title, artist, album, cover_url, audio_url, download_url, duration, genre, language, year, play_count, source, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  id,
                  track[config.titleKey || 'name'] || 'Unknown',
                  track[config.artistKey || 'artist_name'] || 'Unknown',
                  track[config.albumKey || 'album_name'] || '',
                  track[config.coverKey || 'album_image'] || '',
                  track[config.audioKey || 'audio'] || '',
                  track[config.downloadKey || 'audiodownload'] || '',
                  track[config.durationKey || 'duration'] || 0,
                  track[config.genreKey || 'genre'] || '',
                  track[config.languageKey || 'language'] || '',
                  0,
                  0,
                  source.name,
                  new Date().toISOString(),
                  new Date().toISOString()
                )
                totalInserted += result.changes
              }
            } catch (err: any) {
              if (err.name === 'AbortError') {
                console.warn(`[Collector] Request timed out for source "${source.name}". Skipping.`)
              } else {
                console.warn(`[Collector] Error collecting from source "${source.name}": ${err.message}. Skipping.`)
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Collector] Error processing source "${source.name}": ${err.message}. Skipping.`)
        }
      }
    }

    const message = `Collected ${totalInserted} new music tracks`
    await db.prepare(`UPDATE collect_logs SET status = ?, count = ?, message = ?, finished_at = ? WHERE id = ?`)
      .run('success', totalInserted, message, new Date().toISOString(), logId)

    return { count: totalInserted, message }
  } catch (err: any) {
    const message = err.message || 'Unknown error'
    await db.prepare(`UPDATE collect_logs SET status = ?, count = ?, message = ?, finished_at = ? WHERE id = ?`)
      .run('failed', 0, message, new Date().toISOString(), logId)

    return { count: 0, message }
  }
}

export async function collectMovies(): Promise<{ count: number; message: string }> {
  const startedAt = new Date().toISOString()
  let logId = await createCollectLog('movie', 'running', 0, 'Started movie collection', startedAt)

  try {
    let totalInserted = 0

    const sources = await getEnabledSources('movie')

    if (sources.length === 0) {
      const apiKey = getTmdbApiKey()
      const usingFallback = !process.env.TMDB_API_KEY
      const endpoints = [
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=zh-CN&page=1`,
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=zh-CN&page=2`,
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=zh-CN`,
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=zh-CN&page=1`,
      ]

      for (const endpoint of endpoints) {
        try {
          const data = await fetchJSON(endpoint)

          if (data.status_code && data.status_code !== 1) {
            console.warn(`[Collector] TMDB API error: ${data.status_message || data.status_code}. API key: ${usingFallback ? 'fallback' : 'env'}. Skipping.`)
            continue
          }

          if (!data.results || data.results.length === 0) continue

          for (const movie of data.results) {
            const id = uuidv4()
            const genres = movie.genre_ids ? movie.genre_ids.join(',') : ''

            const result = await db.prepare(`
              INSERT OR IGNORE INTO movies (id, title, original_title, overview, poster_url, backdrop_url, rating, release_date, genres, language, region, runtime, cast, director, source, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              id,
              movie.title || movie.original_title || 'Unknown',
              movie.original_title || '',
              movie.overview || '',
              movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : '',
              movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : '',
              movie.vote_average || 0,
              movie.release_date || '',
              genres,
              movie.original_language || '',
              movie.original_language || '',
              0,
              '',
              '',
              'tmdb',
              new Date().toISOString(),
              new Date().toISOString()
            )

            if (result.changes > 0) {
              totalInserted++

              const linkId1 = uuidv4()
              await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                .run(linkId1, id, '720p', '', '')
              const linkId2 = uuidv4()
              await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                .run(linkId2, id, '1080p', '', '')
              const linkId3 = uuidv4()
              await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                .run(linkId3, id, '4K', '', '')
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.warn(`[Collector] TMDB request timed out for endpoint. Skipping.`)
          } else {
            console.warn(`[Collector] Error collecting from TMDB endpoint: ${err.message}. Skipping.`)
          }
        }
      }
    } else {
      for (const source of sources) {
        try {
          const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config

          if (source.api_type === 'tmdb' || config.api === 'tmdb') {
            const apiKey = config.apiKey || getTmdbApiKey()
            const usingFallback = !config.apiKey && !process.env.TMDB_API_KEY
            const language = config.language || 'zh-CN'
            const pages = config.pages || 2

            const endpoints = [
              `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}&page=1`,
              `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=${language}`,
              `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=${language}&page=1`,
            ]

            for (let p = 2; p <= pages; p++) {
              endpoints.push(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}&page=${p}`)
            }

            for (const endpoint of endpoints) {
              try {
                const data = await fetchJSON(endpoint)

                if (data.status_code && data.status_code !== 1) {
                  console.warn(`[Collector] TMDB API error from source "${source.name}": ${data.status_message || data.status_code}. API key: ${usingFallback ? 'fallback' : 'env'}. Skipping.`)
                  continue
                }

                if (!data.results || data.results.length === 0) continue

                for (const movie of data.results) {
                  const id = uuidv4()
                  const genres = movie.genre_ids ? movie.genre_ids.join(',') : ''

                  const result = await db.prepare(`
                    INSERT OR IGNORE INTO movies (id, title, original_title, overview, poster_url, backdrop_url, rating, release_date, genres, language, region, runtime, cast, director, source, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).run(
                    id,
                    movie.title || movie.original_title || 'Unknown',
                    movie.original_title || '',
                    movie.overview || '',
                    movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : '',
                    movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : '',
                    movie.vote_average || 0,
                    movie.release_date || '',
                    genres,
                    movie.original_language || '',
                    movie.original_language || '',
                    0,
                    '',
                    '',
                    source.name,
                    new Date().toISOString(),
                    new Date().toISOString()
                  )

                  if (result.changes > 0) {
                    totalInserted++
                    const linkId1 = uuidv4()
                    await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                      .run(linkId1, id, '720p', '', '')
                    const linkId2 = uuidv4()
                    await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                      .run(linkId2, id, '1080p', '', '')
                    const linkId3 = uuidv4()
                    await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                      .run(linkId3, id, '4K', '', '')
                  }
                }
              } catch (err: any) {
                if (err.name === 'AbortError') {
                  console.warn(`[Collector] TMDB request timed out for source "${source.name}". Skipping.`)
                } else {
                  console.warn(`[Collector] Error collecting from TMDB for source "${source.name}": ${err.message}. Skipping.`)
                }
              }
            }
          } else if (source.url) {
            try {
              const data = await fetchJSON(source.url)
              const movies = config.resultsKey ? data[config.resultsKey] : (data.results || data.data || [])

              for (const movie of movies) {
                const id = uuidv4()

                const result = await db.prepare(`
                  INSERT OR IGNORE INTO movies (id, title, original_title, overview, poster_url, backdrop_url, rating, release_date, genres, language, region, runtime, cast, director, source, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  id,
                  movie[config.titleKey || 'title'] || 'Unknown',
                  movie[config.originalTitleKey || 'original_title'] || '',
                  movie[config.overviewKey || 'overview'] || '',
                  movie[config.posterKey || 'poster_path'] || '',
                  movie[config.backdropKey || 'backdrop_path'] || '',
                  movie[config.ratingKey || 'vote_average'] || 0,
                  movie[config.releaseDateKey || 'release_date'] || '',
                  movie.genre_ids ? movie.genre_ids.join(',') : '',
                  movie[config.languageKey || 'original_language'] || '',
                  movie[config.regionKey || 'original_language'] || '',
                  0,
                  '',
                  '',
                  source.name,
                  new Date().toISOString(),
                  new Date().toISOString()
                )

                if (result.changes > 0) {
                  totalInserted++
                  const linkId1 = uuidv4()
                  await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                    .run(linkId1, id, '720p', '', '')
                  const linkId2 = uuidv4()
                  await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                    .run(linkId2, id, '1080p', '', '')
                  const linkId3 = uuidv4()
                  await db.prepare(`INSERT INTO download_links (id, movie_id, quality, url, size) VALUES (?, ?, ?, ?, ?)`)
                    .run(linkId3, id, '4K', '', '')
                }
              }
            } catch (err: any) {
              if (err.name === 'AbortError') {
                console.warn(`[Collector] Request timed out for source "${source.name}". Skipping.`)
              } else {
                console.warn(`[Collector] Error collecting from source "${source.name}": ${err.message}. Skipping.`)
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Collector] Error processing source "${source.name}": ${err.message}. Skipping.`)
        }
      }
    }

    const message = `Collected ${totalInserted} new movies`
    await db.prepare(`UPDATE collect_logs SET status = ?, count = ?, message = ?, finished_at = ? WHERE id = ?`)
      .run('success', totalInserted, message, new Date().toISOString(), logId)

    return { count: totalInserted, message }
  } catch (err: any) {
    const message = err.message || 'Unknown error'
    await db.prepare(`UPDATE collect_logs SET status = ?, count = ?, message = ?, finished_at = ? WHERE id = ?`)
      .run('failed', 0, message, new Date().toISOString(), logId)

    return { count: 0, message }
  }
}

export function startScheduler() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Starting daily collection...')
    try {
      const musicResult = await collectMusic()
      console.log('[Scheduler] Music:', musicResult.message)
      const movieResult = await collectMovies()
      console.log('[Scheduler] Movies:', movieResult.message)
    } catch (err: any) {
      console.error('[Scheduler] Error:', err.message)
    }
  })
  console.log('[Scheduler] Daily collection scheduled at 02:00')
}
