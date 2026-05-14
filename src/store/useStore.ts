import { create } from 'zustand'

interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string
  audioUrl: string
  downloadUrl: string
  duration: number
  genre: string
  language: string
  year: number
  playCount: number
  source: string
  createdAt: string
}

interface MovieItem {
  id: string
  title: string
  originalTitle: string
  overview: string
  posterUrl: string
  backdropUrl: string
  rating: number
  releaseDate: string
  genres: string[]
  language: string
  region: string
  runtime: number
  cast: string[]
  director: string
  downloadLinks: DownloadLink[]
  source: string
  createdAt: string
}

interface DownloadLink {
  quality: string
  url: string
  size: string
}

interface FavoriteItem {
  id: string
  resourceId: string
  resourceType: string
}

interface HistoryItem {
  id: string
  resourceId: string
  resourceType: string
  playedAt: string
}

interface PendingEvent {
  eventType: string
  resourceId: string
  resourceType: string
  metadata?: any
  timestamp: number
}

interface AppState {
  currentTrack: MusicTrack | null
  isPlaying: boolean
  playlist: MusicTrack[]
  repeatMode: 'none' | 'all' | 'one'
  shuffleMode: boolean
  favorites: FavoriteItem[]
  history: HistoryItem[]
  sidebarOpen: boolean
  pendingEvents: PendingEvent[]
  setCurrentTrack: (track: MusicTrack | null) => void
  setIsPlaying: (playing: boolean) => void
  setPlaylist: (tracks: MusicTrack[]) => void
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void
  setShuffleMode: (shuffle: boolean) => void
  toggleFavorite: (id: string, resourceId: string, resourceType: string) => void
  addHistory: (id: string, resourceId: string, resourceType: string) => void
  setSidebarOpen: (open: boolean) => void
  addPendingEvent: (eventType: string, resourceId: string, resourceType: string, metadata?: any) => void
  clearPendingEvents: () => PendingEvent[]
}

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

const saveToStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
  }
}

export const useStore = create<AppState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  playlist: [],
  repeatMode: 'none',
  shuffleMode: false,
  favorites: loadFromStorage('omnistream_favorites', []),
  history: loadFromStorage('omnistream_history', []),
  sidebarOpen: false,
  pendingEvents: [],

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setPlaylist: (tracks) => set({ playlist: tracks }),

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  setShuffleMode: (shuffle) => set({ shuffleMode: shuffle }),

  toggleFavorite: (id, resourceId, resourceType) => {
    const { favorites } = get()
    const exists = favorites.find(
      (f) => f.resourceId === resourceId && f.resourceType === resourceType
    )
    const updated = exists
      ? favorites.filter((f) => !(f.resourceId === resourceId && f.resourceType === resourceType))
      : [...favorites, { id, resourceId, resourceType }]
    saveToStorage('omnistream_favorites', updated)
    set({ favorites: updated })
  },

  addHistory: (id, resourceId, resourceType) => {
    const { history } = get()
    const filtered = history.filter(
      (h) => !(h.resourceId === resourceId && h.resourceType === resourceType)
    )
    const updated = [{ id, resourceId, resourceType, playedAt: new Date().toISOString() }, ...filtered].slice(0, 100)
    saveToStorage('omnistream_history', updated)
    set({ history: updated })
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addPendingEvent: (eventType, resourceId, resourceType, metadata) => {
    const { pendingEvents } = get()
    set({
      pendingEvents: [...pendingEvents, { eventType, resourceId, resourceType, metadata, timestamp: Date.now() }],
    })
  },

  clearPendingEvents: () => {
    const { pendingEvents } = get()
    set({ pendingEvents: [] })
    return pendingEvents
  },
}))

export type { MusicTrack, MovieItem, DownloadLink, FavoriteItem, HistoryItem }
