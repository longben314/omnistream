import type { MusicTrack, MovieItem } from '@/store/useStore'

const BASE = '/api'

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

const ARRAY_FIELDS = new Set(['genres', 'cast'])

function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      const camelKey = toCamelCase(key)
      let value = transformKeys(obj[key])
      if (ARRAY_FIELDS.has(key) && typeof value === 'string') {
        value = value ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      }
      result[camelKey] = value
    }
    return result
  }
  return obj
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const json = await res.json()
  return transformKeys(json) as T
}

interface PaginatedMusicResponse {
  success: boolean
  tracks: MusicTrack[]
  total: number
  page: number
  totalPages: number
}

interface PaginatedMovieResponse {
  success: boolean
  movies: MovieItem[]
  total: number
  page: number
  totalPages: number
}

interface HomeData {
  success: boolean
  featured: any[]
  hotMusic: MusicTrack[]
  hotMovies: MovieItem[]
  latestMusic: MusicTrack[]
  latestMovies: MovieItem[]
}

export async function fetchHomeData(): Promise<HomeData> {
  return request<HomeData>('/home')
}

export async function fetchMusicList(params?: {
  page?: number
  pageSize?: number
  genre?: string
  sort?: string
}): Promise<PaginatedMusicResponse> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('limit', String(params.pageSize))
  if (params?.genre) query.set('genre', params.genre)
  if (params?.sort) query.set('sort', params.sort)
  return request(`/music?${query.toString()}`)
}

export async function fetchMusicSearch(query: string): Promise<{ success: boolean; tracks: MusicTrack[]; total: number }> {
  return request(`/music/search?q=${encodeURIComponent(query)}`)
}

export async function fetchMusicById(id: string): Promise<{ success: boolean; track: MusicTrack }> {
  return request(`/music/${id}`)
}

export async function fetchMovieList(params?: {
  page?: number
  pageSize?: number
  genre?: string
  region?: string
  sort?: string
}): Promise<PaginatedMovieResponse> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('limit', String(params.pageSize))
  if (params?.genre) query.set('genre', params.genre)
  if (params?.region) query.set('region', params.region)
  if (params?.sort) query.set('sort', params.sort)
  return request(`/movies?${query.toString()}`)
}

export async function fetchMovieSearch(query: string): Promise<{ success: boolean; movies: MovieItem[]; total: number }> {
  return request(`/movies/search?q=${encodeURIComponent(query)}`)
}

export async function fetchMovieById(id: string): Promise<{ success: boolean; movie: MovieItem; downloadLinks: any[] }> {
  return request(`/movies/${id}`)
}

export async function fetchFavorites(type?: string): Promise<{ success: boolean; favorites: any[] }> {
  const query = type ? `?type=${type}` : ''
  return request(`/user/favorites${query}`)
}

export async function addFavorite(resourceId: string, resourceType: string): Promise<{ success: boolean; favorite: any }> {
  return request('/user/favorites', {
    method: 'POST',
    body: JSON.stringify({ resourceId, resourceType }),
  })
}

export async function removeFavorite(id: string): Promise<{ success: boolean }> {
  return request(`/user/favorites/${id}`, { method: 'DELETE' })
}

export async function fetchHistory(): Promise<{ success: boolean; history: any[] }> {
  return request('/user/history')
}

export async function addHistory(resourceId: string, resourceType: string, progress?: number): Promise<{ success: boolean }> {
  return request('/user/history', {
    method: 'POST',
    body: JSON.stringify({ resourceId, resourceType, progress }),
  })
}

export async function triggerCollectMusic(): Promise<{ success: boolean; count: number; message: string }> {
  return request('/collect/music', { method: 'POST' })
}

export async function triggerCollectMovies(): Promise<{ success: boolean; count: number; message: string }> {
  return request('/collect/movies', { method: 'POST' })
}

export async function fetchCollectStatus(): Promise<{ success: boolean; music: any[]; movie: any[] }> {
  return request('/collect/status')
}

export interface SourceItem {
  id: string
  name: string
  type: string
  apiType: string
  config: string
  url: string
  enabled: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export async function fetchSources(): Promise<{ success: boolean; sources: SourceItem[] }> {
  return request('/sources')
}

export async function addSource(data: any): Promise<{ success: boolean; source: any }> {
  return request('/sources', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSource(id: string, data: any): Promise<{ success: boolean }> {
  return request(`/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteSource(id: string): Promise<{ success: boolean }> {
  return request(`/sources/${id}`, { method: 'DELETE' })
}

export async function importSources(url: string): Promise<{ success: boolean; imported: number; message: string }> {
  return request('/sources/import', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export async function exportSources(): Promise<any> {
  return request('/sources/export')
}

export async function trackEvent(eventType: string, resourceId: string, resourceType: string, metadata?: any): Promise<{ success: boolean; eventId: string }> {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify({ eventType, resourceId, resourceType, metadata }),
  })
}

export async function trackEventBatch(events: { eventType: string; resourceId: string; resourceType: string; metadata?: any }[]): Promise<{ success: boolean; eventIds: string[] }> {
  return request('/events/batch', {
    method: 'POST',
    body: JSON.stringify({ events }),
  })
}

export async function fetchEventStats(days?: number): Promise<{ success: boolean; stats: any }> {
  const query = days ? `?days=${days}` : ''
  return request(`/events/stats${query}`)
}

export async function fetchRankings(type?: string, resourceType?: string): Promise<{ success: boolean; rankings: any[] }> {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (resourceType) params.set('resource_type', resourceType)
  return request(`/rankings?${params.toString()}`)
}

export async function fetchRankingSummary(): Promise<{ success: boolean; summary: any }> {
  return request('/rankings/summary')
}

export async function fetchRecommendations(userId?: string): Promise<{ success: boolean; recommendations: any[]; isColdStart: boolean }> {
  const query = userId ? `?user_id=${userId}` : ''
  return request(`/recommendations${query}`)
}

export async function fetchSkipTimestamps(resourceId: string, type?: string): Promise<{ success: boolean; timestamps: any[] }> {
  const query = type ? `?type=${type}` : ''
  return request(`/skip/${resourceId}${query}`)
}

export async function submitSkipTimestamp(resourceId: string, skipType: string, startTime: number, endTime: number): Promise<{ success: boolean; timestamp: any }> {
  return request('/skip', {
    method: 'POST',
    body: JSON.stringify({ resourceId, skipType, startTime, endTime }),
  })
}

export async function voteSkipTimestamp(id: string, direction: 'up' | 'down'): Promise<{ success: boolean }> {
  return request(`/skip/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ direction }),
  })
}
