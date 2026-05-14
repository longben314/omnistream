import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import MusicCard from '@/components/MusicCard'
import MovieCard from '@/components/MovieCard'
import { fetchMusicSearch, fetchMovieSearch } from '@/utils/api'
import type { MusicTrack, MovieItem } from '@/store/useStore'

export default function Search() {
  const [category, setCategory] = useState<'music' | 'movie'>('music')
  const [query, setQuery] = useState('')
  const [musicResults, setMusicResults] = useState<MusicTrack[]>([])
  const [movieResults, setMovieResults] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setMusicResults([])
      setMovieResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)

    if (category === 'music') {
      fetchMusicSearch(q)
        .then((res) => setMusicResults(res.tracks || []))
        .catch(() => setMusicResults([]))
        .finally(() => setLoading(false))
    } else {
      fetchMovieSearch(q)
        .then((res) => setMovieResults(res.movies || []))
        .catch(() => setMovieResults([]))
        .finally(() => setLoading(false))
    }
  }

  const handleCategoryChange = (cat: 'music' | 'movie') => {
    setCategory(cat)
    if (query.trim()) {
      setLoading(true)
      if (cat === 'music') {
        fetchMusicSearch(query)
          .then((res) => setMusicResults(res.tracks || []))
          .catch(() => setMusicResults([]))
          .finally(() => setLoading(false))
      } else {
        fetchMovieSearch(query)
          .then((res) => setMovieResults(res.movies || []))
          .catch(() => setMovieResults([]))
          .finally(() => setLoading(false))
      }
    }
  }

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="mb-8">
        <h1 className="section-title text-center mb-6">搜索</h1>
        <SearchBar
          onSearch={handleSearch}
          category={category}
          onCategoryChange={handleCategoryChange}
          placeholder={category === 'music' ? '搜索音乐、歌手、专辑...' : '搜索影视、导演、演员...'}
        />
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-3">
              <div className="aspect-square rounded-lg skeleton mb-3" />
              <div className="h-4 w-3/4 rounded skeleton mb-2" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          ))}
        </div>
      )}

      {!loading && searched && category === 'music' && (
        <AnimatePresence mode="wait">
          {musicResults.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {musicResults.map((track) => (
                <MusicCard key={track.id} track={track} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <SearchIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-2">未找到相关音乐</p>
              <p className="text-sm text-gray-500">试试其他关键词，如歌手名、歌曲名或专辑名</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {!loading && searched && category === 'movie' && (
        <AnimatePresence mode="wait">
          {movieResults.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {movieResults.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <SearchIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-2">未找到相关影视</p>
              <p className="text-sm text-gray-500">试试其他关键词，如片名、导演或演员</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {!searched && !loading && (
        <div className="text-center py-20">
          <SearchIcon size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">输入关键词开始搜索</p>
        </div>
      )}
    </div>
  )
}
